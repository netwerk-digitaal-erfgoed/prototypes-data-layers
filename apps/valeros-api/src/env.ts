import { Client } from "@repo/typesense/client";

export type Bindings = {
  TYPESENSE_API_KEY: string;
  TYPESENSE_HOST: string;
};

export type Env = {
  Bindings: Bindings;
  Variables: {
    typesenseClient: Client;
  };
};
