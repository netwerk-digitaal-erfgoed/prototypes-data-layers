import { defineCommand } from "citty";
import { prepare } from "../prepare.js";

const buildArgs = {
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
    description: "Prepare data for ingestion into the search index",
  },
  args: buildArgs,
  async run({ args }) {
    await prepare({
      inputFile: args.inputFile,
      outputDir: args.outputDir,
    });
  },
});
