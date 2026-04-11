import { createReadStream, createWriteStream } from "node:fs";
import { chain } from "stream-chain";
import { pick } from "stream-json/filters/pick.js";
import { streamArray } from "stream-json/streamers/stream-array.js";
import { z } from "zod";
import {
  additionalTypeJsonLdSchema,
  genreJsonLdSchema,
  heritageObjectJsonLdSchema,
  contentLocationJsonLdSchema,
  materialJsonLdSchema,
  creatorJsonLdSchema,
  datasetJsonLdSchema,
  organizationsJsonLdSchema,
  licensesJsonLdSchema,
} from "./definitions.js";
import { EOL } from "node:os";
import path from "node:path";

const toJsonLinesFileInputSchema = z.object({
  inputFile: z.string(),
  outputFile: z.string(),
  schema: z.instanceof(z.ZodType),
});

type ToJsonLinesFileInput = z.input<typeof toJsonLinesFileInputSchema>;

export async function toJsonLinesFile(input: ToJsonLinesFileInput) {
  const opts = toJsonLinesFileInputSchema.parse(input);

  const writeStream = createWriteStream(opts.outputFile);
  const schema = z.object({ value: input.schema });

  const writeResourceToJsonlFile = (data: any) => {
    const result = schema.safeParse(data);
    if (!result.success) {
      // this.logger.warn({ record: data }, `Ignoring invalid resource`);
      return;
    }

    const resource = result.data.value;

    // TODO: handle back-pressure
    writeStream.write(JSON.stringify(resource) + EOL);
  };

  await new Promise<void>((resolve, reject) => {
    const stream = createReadStream(opts.inputFile);
    const pipeline = chain([stream, pick.withParser({ filter: "@graph" }), streamArray()]);

    pipeline.on("end", () => {
      writeStream.end();
      resolve();
    });

    pipeline.on("error", () => {
      writeStream.end();
      reject();
    });

    pipeline.on("data", writeResourceToJsonlFile);
  });
}

const toJsonLinesFilesInputSchema = z.object({
  inputFile: z.string(),
  outputDir: z.string(),
});

type ToJsonLinesFilesInput = z.input<typeof toJsonLinesFilesInputSchema>;

export async function toJsonLinesFiles(input: ToJsonLinesFilesInput) {
  const opts = toJsonLinesFilesInputSchema.parse(input);

  const files = [
    {
      name: "additional-types.jsonl",
      schema: additionalTypeJsonLdSchema,
    },
    {
      name: "content-locations.jsonl",
      schema: contentLocationJsonLdSchema,
    },
    {
      name: "creators.jsonl",
      schema: creatorJsonLdSchema,
    },
    {
      name: "datasets.jsonl",
      schema: datasetJsonLdSchema,
    },
    {
      name: "genres.jsonl",
      schema: genreJsonLdSchema,
    },
    {
      name: "heritage-objects.jsonl",
      schema: heritageObjectJsonLdSchema,
    },
    {
      name: "licenses.jsonl",
      schema: licensesJsonLdSchema,
    },
    {
      name: "materials.jsonl",
      schema: materialJsonLdSchema,
    },
    {
      name: "organizations.jsonl",
      schema: organizationsJsonLdSchema,
    },
  ];

  for (let file of files) {
    const outputFile = path.join(input.outputDir, file.name);

    await toJsonLinesFile({
      inputFile: opts.inputFile,
      outputFile: outputFile,
      schema: file.schema,
    });
  }
}
