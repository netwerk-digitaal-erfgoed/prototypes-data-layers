import { factory } from "./factory.js";
import heritageObjectsApp from "./heritage-objects.js";
import organizationsApp from "./organizations.js";
import personsApp from "./persons.js";
import placesApp from "./places.js";
import termsApp from "./terms.js";

const app = factory.createApp({ strict: true });

// Group without changing base
// (https://hono.dev/docs/api/routing#grouping-without-changing-base)
app.route("/", heritageObjectsApp);
app.route("/", organizationsApp);
app.route("/", personsApp);
app.route("/", placesApp);
app.route("/", termsApp);

app.get("/health", async (c) => {
  return c.body(null, 204);
});

export default app;
