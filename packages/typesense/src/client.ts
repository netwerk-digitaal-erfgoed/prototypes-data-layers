import { setDefaultConfiguration } from "typesense-ts";
import { z } from "zod";

const setConfigurationInputSchema = z.object({
  apiKey: z.string(),
  host: z.string(),
});

type SetConfigurationInput = z.input<typeof setConfigurationInputSchema>;

export function setConfiguration(input: SetConfigurationInput) {
  const opts = setConfigurationInputSchema.parse(input);

  setDefaultConfiguration({
    apiKey: opts.apiKey,
    nodes: [{ url: opts.host }],
  });
}
