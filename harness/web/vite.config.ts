import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const BACKEND = "http://127.0.0.1:8799";

// The Python backend serves `dist/` and falls back to index.html on unknown
// paths, so the app is built at the site root and routed client-side.
export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2022",
  },
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      // Order matters: the websocket prefix has to be matched before /api.
      "/api/ws": {
        target: BACKEND.replace(/^http/, "ws"),
        ws: true,
        changeOrigin: true,
      },
      "/api": {
        target: BACKEND,
        changeOrigin: true,
      },
    },
  },
});
