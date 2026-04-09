import { Hono } from "hono";

const app = new Hono();

app.get("/health", (c) => {
  return c.text("Ok");
});

export default app;
