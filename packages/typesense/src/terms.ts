import { Client } from "typesense";
import { z } from "zod";

const documentSchema = z.object({
  id: z.string(),
  type: z.string(),
  name: z.string(),
});

export type Document = z.output<typeof documentSchema>;

const searchResultSchema = z.object({
  found: z.number(),
  page: z.number(),
  request_params: z.object({
    per_page: z.number(),
    q: z.string(),
  }),
  hits: z.array(
    z.object({
      document: documentSchema,
    }),
  ),
});

export type SearchResult = z.output<typeof searchResultSchema>;

const searchInputSchema = z.object({
  client: z.instanceof(Client),
  page: z.number().default(1),
  size: z.number().default(10),
  sort: z.string().optional(),
  q: z.string(),
});

type SearchInput = z.input<typeof searchInputSchema>;

export async function search(input: SearchInput): Promise<SearchResult> {
  const opts = searchInputSchema.parse(input);

  const response = await opts.client
    .collections("terms")
    .documents()
    .search({
      page: opts.page,
      per_page: opts.size,
      q: opts.q,
      // The order matters: "A document that matches on a field earlier in
      // the list of query_by fields is considered more relevant than a
      // document matched on a field later in the list."
      // (https://typesense.org/docs/guide/ranking-and-relevance.html)
      query_by: ["name"],
      sort_by: opts.sort,
      // Always use infix search. TBD: is this a sensible default
      // or a feature that should be enabled per search request?
      infix: "always",
    });

  const result = searchResultSchema.parse(response);

  return result;
}
