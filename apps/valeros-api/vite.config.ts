import { defineConfig } from "vite";
import { nitro } from "nitro/vite";

export default defineConfig({
  plugins: [nitro()],
  nitro: {
    serverEntry: "src/server.ts",
    output: {
      dir: "dist",
    },
  },
});
