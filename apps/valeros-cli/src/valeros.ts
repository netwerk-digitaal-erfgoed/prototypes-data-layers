#!/usr/bin/env node
import { defineCommand, runMain } from "citty";

const main = defineCommand({
  meta: {
    name: "valeros",
    description: "Valeros CLI",
  },
  subCommands: {
    import: () => import("./commands/import.js").then((r) => r.default),
    prepare: () => import("./commands/prepare.js").then((r) => r.default),
  },
});

runMain(main);
