import { factory } from "./factory.js";
import datasetsApp from "./datasets.js";
import heritageObjectsApp from "./heritage-objects.js";
import licensesApp from "./licenses.js";
import organizationsApp from "./organizations.js";
import personsApp from "./persons.js";
import placesApp from "./places.js";
import termsApp from "./terms.js";

const app = factory.createApp({ strict: true });

// Group without changing base
// (https://hono.dev/docs/api/routing#grouping-without-changing-base)
app.route("/", datasetsApp);
app.route("/", heritageObjectsApp);
app.route("/", licensesApp);
app.route("/", organizationsApp);
app.route("/", personsApp);
app.route("/", placesApp);
app.route("/", termsApp);

app.get("/health", async (c) => {
  return c.body(null, 204);
});

export default app;
