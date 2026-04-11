import { z } from "zod";
import { createHash } from "node:crypto";

export const heritageObjectJsonLdSchema = z
  .object({
    "@id": z.string(),
    "@type": z.enum(["schema:CreativeWork"]),
    "schema:name": z.preprocess(
      (value) => (Array.isArray(value) ? value : [value]),
      z.array(z.object({ "@value": z.string() }).transform((data) => data["@value"])),
    ),
    "schema:description": z.preprocess(
      (value) => (Array.isArray(value) ? value : [value]),
      z.array(z.object({ "@value": z.string() }).transform((data) => data["@value"])),
    ),
  })
  .transform((data) => ({
    id: createHash("md5").update(data["@id"]).digest("hex"),
    type: "CreativeWork",
    name: data["schema:name"]?.join("; "), // Merge into one string
    description: data["schema:description"]?.join("; "), // Merge into one string
    isBasedOn: {
      id: data["@id"],
      type: "CreativeWork",
    },
  }));

export const materialJsonLdSchema = z
  .object({
    "@id": z.string(),
    "@type": z.enum(["ext:Material"]),
    "schema:name": z.preprocess(
      (value) => (Array.isArray(value) ? value : [value]),
      z.array(z.object({ "@value": z.string() }).transform((data) => data["@value"])),
    ),
  })
  .transform((data) => ({
    id: createHash("md5").update(data["@id"]).digest("hex"),
    type: "DefinedTerm",
    name: data["schema:name"]?.join("; "), // Merge into one string
  }));
