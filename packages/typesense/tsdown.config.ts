import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/**/!(*.test).ts"],
  deps: {
    skipNodeModulesBundle: true,
  },
  dts: true,
  sourcemap: false,
  exports: {
    all: true,
  },
});
