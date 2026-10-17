import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { START, StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";
import { z } from "zod";
import { connectTtcMcp } from "./mcp.js";
import type { GoogleMapsApi } from "./GoogleMapsApi.js";
import type { TtcApi } from "./TtcApi.js";
import type { Locale } from "./types.js";

export type WhatIfInput = { from: [number, number]; to: [number, number]; locale: Locale; offsetsMinutes: number[] };

const SYSTEM_PROMPT = `You are the What-if Travel Simulator inside a Tbilisi public transit application.
Use the simulate_departures MCP tool exactly once. Compare the requested departure times using only returned data. Rank the best option by total duration first, then mention route changes, walking, and important differences. Clearly distinguish the live TTC baseline from future Google route scenarios and never invent TTC future arrivals. Return a compact comparison with one recommendation and a short limitation note. Do not answer unrelated questions.`;

function mcpTool(client: Awaited<ReturnType<typeof connectTtcMcp>>["client"]) {
  return new DynamicStructuredTool({
    name: "simulate_departures",
    description: "Compare selected departure-time scenarios using current transit route data.",
    schema: z.object({ fromLat: z.number(), fromLon: z.number(), toLat: z.number(), toLon: z.number(), offsetsMinutes: z.array(z.number().int().min(0).max(180)).min(1).max(6), locale: z.enum(["en", "ka"]) }),
    func: async (input) => {
      const response = await client.callTool({ name: "simulate_departures", arguments: input });
      const content = Array.isArray(response.content) ? response.content : [];
      return content.filter((part): part is { type: "text"; text: string } => typeof part === "object" && part !== null && part.type === "text" && typeof part.text === "string").map((part) => part.text).join("\n") || "No simulation data returned.";
    },
  });
}

function contentText(message: AIMessage) {
  if (typeof message.content === "string") return message.content;
  return message.content.map((part) => typeof part === "string" ? part : "text" in part ? part.text : "").join("");
}

export async function runWhatIfSimulator(ttc: TtcApi, apiKey: string, input: WhatIfInput, googleMaps?: GoogleMapsApi) {
  if (!apiKey || apiKey === "my-key") throw new Error("WHAT_IF_API_KEY is not configured yet");
  const mcp = await connectTtcMcp(ttc, googleMaps);
  try {
    const tools = [mcpTool(mcp.client)];
    const model = new ChatGoogleGenerativeAI({ apiKey, model: "gemini-3.1-flash-lite", temperature: 0, maxRetries: 0, maxOutputTokens: 700 }).bindTools(tools);
    const graph = new StateGraph(MessagesAnnotation).addNode("assistant", async (state) => ({ messages: [await model.invoke(state.messages)] })).addNode("tools", new ToolNode(tools)).addEdge(START, "assistant").addConditionalEdges("assistant", toolsCondition).addEdge("tools", "assistant").compile();
    const output = await graph.invoke({ messages: [new SystemMessage(SYSTEM_PROMPT), new HumanMessage(JSON.stringify(input))] });
    const last = output.messages[output.messages.length - 1];
    return { message: last instanceof AIMessage ? contentText(last) : "No simulation result returned." };
  } finally { await mcp.close(); }
}
