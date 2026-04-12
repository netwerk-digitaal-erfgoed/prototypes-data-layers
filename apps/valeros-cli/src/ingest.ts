import { createReadStream } from "node:fs";
import { glob } from "node:fs/promises";
import path from "node:path";
import { chain } from "stream-chain";
import { JsonlItem, jsonlParser } from "stream-json/jsonl/parser.js";
import { batch } from "stream-json/utils/batch.js";
import { z } from "zod";
import { CollectionSchema, collectionSchemas } from "./typesense.js";

async function ingestFile(filePath: string, collectionSchema: CollectionSchema) {
  let inFlightBatches = 0;
  let resolveAllBatchesDone: () => void;
  let rejectOnError = (_err: unknown) => {};

  const allBatchesDone = new Promise<void>((resolve, reject) => {
    resolveAllBatchesDone = resolve;
    rejectOnError = reject;
  });

  // Import resources from the file in batches, to prevent
  // overpowering Typesense with one, huge import request
  const pipeline = chain([
    createReadStream(filePath),
    jsonlParser.asStream(),
    batch({ batchSize: 25 }),
  ]);

  pipeline.on("end", () => {
    if (inFlightBatches === 0) {
      resolveAllBatchesDone();
    }
  });

  pipeline.on("error", rejectOnError);

  pipeline.on("data", (data) => {
    const documents: JsonlItem["value"][] = [];
    data.forEach((pair: JsonlItem) => {
      documents.push(pair.value);
    });

    // Event emitters don't wait for async functions:
    // the `end` event may fire before all `import()`s complete.
    // Fix by counting in-flight batches and resolving when all
    // batches have finished.
    inFlightBatches++;

    collectionSchema.documents
      .import(documents, {
        return_doc: false,
      })
      .finally(() => {
        inFlightBatches--;
        if (inFlightBatches === 0) {
          resolveAllBatchesDone();
        }
      });
  });

  await allBatchesDone;
}

const ingestInputSchema = z.object({
  inputDir: z.string(),
});

type IngestInput = z.input<typeof ingestInputSchema>;

export async function ingest(input: IngestInput) {
  const opts = ingestInputSchema.parse(input);

  const pattern = path.join(opts.inputDir, "**/*.jsonl");

  for await (const file of glob(pattern)) {
    const collectionName = path.parse(file).name;

    const collectionSchema = collectionSchemas.find(
      (schema) => schema.schema.name === collectionName,
    );
    if (collectionSchema === undefined) {
      continue; // Not found
    }

    // Delete the existing collection, if any.
    // Ignore error if the collection does not exist
    try {
      await collectionSchema.delete();
    } catch (err) {
      const error = err as Error;
      if (!error.message.includes(`No collection with name \`${collectionName}\` found`)) {
        throw err;
      }
    }

    // Create or re-create the collection
    await collectionSchema.create();

    // Import the resources into the collection
    await ingestFile(file, collectionSchema);
  }
}
