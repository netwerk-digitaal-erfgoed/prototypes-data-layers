import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/valeros.ts"],
  deps: {
    onlyBundle: false,
  },
  outputOptions: {
    codeSplitting: false,
  },
});
