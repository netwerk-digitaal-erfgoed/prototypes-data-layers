import { defineCommand } from "citty";
import { toJsonLinesFiles } from "../prepare.js";

export const buildArgs = {
  inputFile: {
    type: "string",
    description: "JSON-LD file with data",
    required: true,
  },
  outputDir: {
    type: "string",
    description: "Directory for storing the JSON Lines files with data",
    required: true,
  },
} as const;

export default defineCommand({
  meta: {
    name: "prepare",
    description: "Prepare data for importing into the search index",
  },
  args: buildArgs,
  async run({ args }) {
    await toJsonLinesFiles({
      inputFile: args.inputFile!,
      outputDir: args.outputDir!,
    });
  },
});
