import { collection, setDefaultConfiguration } from "typesense-ts";
import { env } from "node:process";

// Configure and set as default
setDefaultConfiguration({
  apiKey: env.TYPESENSE_API_KEY!,
  nodes: [{ url: env.TYPESENSE_HOST! }],
});

// Define collection schemas
const genresSchema = collection({
  name: "genres",
  fields: [
    { name: "type", type: "string" },
    { name: "name", type: "string" },
  ],
});

// Register the collections globally for type safety
declare module "typesense-ts" {
  interface Collections {
    genres: typeof genresSchema.schema;
  }
}

export async function createCollections() {
  await genresSchema.create();
}
