import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(() => {
  const appRoot = dirname(fileURLToPath(import.meta.url));
  const projectRoot = resolve(appRoot, "../..");

  return {
    root: appRoot,
    envDir: projectRoot,
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
