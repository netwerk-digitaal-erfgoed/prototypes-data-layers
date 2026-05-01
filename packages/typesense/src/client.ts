import { Client as TypesenseClient } from "typesense";
import { z } from "zod";

const getClientInputSchema = z.object({
  apiKey: z.string(),
  host: z.string(),
});

type GetClientInput = z.input<typeof getClientInputSchema>;

export function getClient(input: GetClientInput) {
  const opts = getClientInputSchema.parse(input);

  const client = new TypesenseClient({
    nodes: [{ url: opts.host }],
    apiKey: opts.apiKey,
  });

  return client;
}

export type Client = TypesenseClient;
