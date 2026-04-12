import { defineCommand } from "citty";

export const buildArgs = {
  inputDir: {
    type: "string",
    description: "Directory with JSON Lines files to import",
    required: true,
  },
} as const;

export default defineCommand({
  meta: {
    name: "import",
    description: "Import data into the search index",
  },
  args: buildArgs,
  async run({ args }) {},
});
