import { factory } from "./factory.js";
import heritageObjectsApp from "./heritage-objects.js";
import termsApp from "./terms.js";

const app = factory.createApp({ strict: true });

// Group without changing base
// (https://hono.dev/docs/api/routing#grouping-without-changing-base)
app.route("/", heritageObjectsApp);
app.route("/", termsApp);

app.get("/health", async (c) => {
  return c.body(null, 204);
});

export default app;
