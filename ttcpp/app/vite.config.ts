import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const appRoot = dirname(fileURLToPath(import.meta.url));
  const projectRoot = resolve(appRoot, "../..");
  const env = loadEnv(mode, projectRoot, "");

  return {
    root: appRoot,
    envDir: projectRoot,
    define: {
      __GOOGLE_MAPS_API_KEY__: JSON.stringify(env.GOOGLE_MAPS_API_KEY ?? ""),
    },
    plugins: [react()],
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:8787",
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: "../dist",
      emptyOutDir: true,
    },
  };
});
