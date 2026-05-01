import { createReadStream } from "node:fs";
import path from "node:path";
import { env } from "node:process";
import { glob } from "node:fs/promises";
import { chain } from "stream-chain";
import { JsonlItem, jsonlParser } from "stream-json/jsonl/parser.js";
import { batch } from "stream-json/utils/batch.js";
import { z } from "zod";
import { Client, getClient } from "@repo/typesense/client";
import { collectionSchemas } from "./typesense.js";

async function ingestFile(filePath: string, typesenseClient: Client, collectionName: string) {
  await new Promise<void>((resolve, reject) => {
    let inFlightBatches = 0;

    // Import resources from the file in batches, to prevent
    // overpowering Typesense with one, huge import request
    const pipeline = chain([
      createReadStream(filePath),
      jsonlParser.asStream(),
      batch({ batchSize: 100 }),
    ]);

    // Event emitters don't wait for async functions:
    // the `end` event may fire before all `import()`s complete.
    // Fix by counting in-flight batches and resolving when all
    // batches have finished.
    pipeline.on("end", () => {
      if (inFlightBatches === 0) {
        resolve();
      }
    });

    pipeline.on("error", reject);

    pipeline.on("data", async (data) => {
      inFlightBatches++;
      const documents = data.map((pair: JsonlItem) => pair.value);

      try {
        await typesenseClient.collections(collectionName).documents().import(documents, {
          return_doc: false,
        });
      } finally {
        inFlightBatches--;
        if (inFlightBatches === 0) {
          resolve();
        }
      }
    });
  });
}

const ingestInputSchema = z.object({
  inputDir: z.string(),
});

type IngestInput = z.input<typeof ingestInputSchema>;

export async function ingest(input: IngestInput) {
  const opts = ingestInputSchema.parse(input);

  const typesenseClient = getClient({
    apiKey: env.TYPESENSE_API_KEY!,
    host: env.TYPESENSE_HOST!,
  });

  const filePaths: string[] = [];
  const pattern = path.join(opts.inputDir, "*.jsonl");
  for await (const filePath of glob(pattern)) {
    filePaths.push(filePath);
  }

  // Sort to make sure the files are imported in the right order
  filePaths.sort();

  for (const filePath of filePaths) {
    const fileName = path.parse(filePath).name; // Without extension

    // Remove the order indicator, if any - e.g. `01.myname` => `myname`
    const indexOfFirstDot = fileName.indexOf(".");
    const collectionName = indexOfFirstDot !== -1 ? fileName.slice(indexOfFirstDot + 1) : fileName;

    const collectionSchema = collectionSchemas.find((schema) => schema.name === collectionName);
    if (collectionSchema === undefined) {
      continue; // Not found
    }

    // Delete the existing collection, if any.
    // Ignore error if the collection does not exist
    try {
      await typesenseClient.collections(collectionName).delete();
    } catch (err) {
      const error = err as Error;
      if (!error.message.includes(`No collection with name \`${collectionName}\` found`)) {
        throw err;
      }
    }

    // Create or re-create the collection
    await typesenseClient.collections().create(collectionSchema);

    // Import the resources into the collection
    await ingestFile(filePath, typesenseClient, collectionName);
  }
}
