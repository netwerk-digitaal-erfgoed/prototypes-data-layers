import { env } from "hono/adapter";
import { cors } from "hono/cors";
import { createFactory } from "hono/factory";
import { logger } from "hono/logger";
import { trimTrailingSlash } from "hono/trailing-slash";
import { setConfiguration } from "@repo/typesense/client";
import { Bindings, Env } from "./env.js";

export const factory = createFactory<Env>({
  initApp: (app) => {
    app.use(
      cors(),
      logger(),
      trimTrailingSlash(), // Redirect `/page/` to `/page`
    );

    // Generic middleware that runs on every request
    app.use(async (c, next) => {
      const appEnv = env<Bindings>(c);

      setConfiguration({
        apiKey: appEnv.TYPESENSE_API_KEY,
        host: appEnv.TYPESENSE_HOST,
      });

      await next();
    });
  },
});
