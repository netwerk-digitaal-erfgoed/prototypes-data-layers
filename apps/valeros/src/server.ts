import { Hono } from "hono";

const app = new Hono();

app.get("/health", async (c) => {
  return c.body(null, 204);
});

export default app;
