import { defineCommand } from "citty";
import { ingest } from "../ingest.js";

export const buildArgs = {
  inputDir: {
    type: "string",
    description: "Directory with JSON Lines files to ingest",
    required: true,
  },
} as const;

export default defineCommand({
  meta: {
    name: "ingest",
    description: "Ingest data into the search index",
  },
  args: buildArgs,
  async run({ args }) {
    await ingest({
      inputDir: args.inputDir,
    });
  },
});
