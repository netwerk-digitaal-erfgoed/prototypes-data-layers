import path from "node:path";
import { glob } from "node:fs/promises";
import { z } from "zod";

const ingestInputSchema = z.object({
  inputDir: z.string(),
});

type IngestInput = z.input<typeof ingestInputSchema>;

export async function ingest(input: IngestInput) {
  const opts = ingestInputSchema.parse(input);

  const pattern = path.join(opts.inputDir, "**/*.jsonl");

  for await (const file of glob(pattern)) {
    const collectionName = path.parse(file).name;
    console.log(collectionName);
  }
}
