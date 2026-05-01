import { CollectionCreateSchema } from "typesense";

export const additionalTypeSchema = {
  name: "additional_types",
  fields: [
    { name: "type", type: "string" },
    { name: "name", type: "string" },
  ],
} as const satisfies CollectionCreateSchema;

export type AdditionalType = {
  id: string;
  type: string;
  name: string;
};

export const contentLocationsSchema = {
  name: "content_locations",
  fields: [
    { name: "type", type: "string" },
    { name: "name", type: "string" },
  ],
} as const satisfies CollectionCreateSchema;

export type ContentLocation = {
  id: string;
  type: string;
  name: string;
};

export const creatorsSchema = {
  name: "creators",
  fields: [
    { name: "type", type: "string" },
    { name: "name", type: "string" },
  ],
} as const satisfies CollectionCreateSchema;

export type Creator = {
  id: string;
  type: string;
  name: string;
};

export const datasetsSchema = {
  name: "datasets",
  fields: [
    { name: "type", type: "string" },
    { name: "name", type: "string" },
  ],
} as const satisfies CollectionCreateSchema;

export type Dataset = {
  id: string;
  type: string;
  name: string;
};

export const genresSchema = {
  name: "genres",
  fields: [
    { name: "type", type: "string" },
    { name: "name", type: "string" },
  ],
} as const satisfies CollectionCreateSchema;

export type Genre = {
  id: string;
  type: string;
  name: string;
};

export const heritageObjectsSchema = {
  name: "heritage_objects",
  enable_nested_fields: true,
  fields: [
    { name: "type", type: "string[]" },
    { name: "additional_type", type: "string[]", optional: true, facet: true },
    {
      name: "additional_type_id",
      type: "string[]",
      optional: true,
      reference: "additional_types.id",
    },
    { name: "content_location", type: "string[]", optional: true, facet: true },
    {
      name: "content_location_id",
      type: "string[]",
      optional: true,
      reference: "content_locations.id",
    },
    { name: "creator", type: "string[]", optional: true, facet: true },
    { name: "creator_id", type: "string[]", optional: true, reference: "creators.id" },
    { name: "date_created", type: "string", optional: true },
    { name: "dataset", type: "string", facet: true },
    { name: "dataset_id", type: "string", reference: "datasets.id" },
    { name: "description", type: "string", optional: true },
    { name: "genre", type: "string[]", optional: true, facet: true },
    { name: "genre_id", type: "string[]", optional: true, reference: "genres.id" },
    { name: "is_based_on", type: "object" },
    { name: "is_based_on.id", type: "string" },
    { name: "is_based_on.type", type: "string" },
    { name: "license", type: "string", facet: true },
    { name: "license_id", type: "string", reference: "licenses.id" },
    { name: "material", type: "string[]", optional: true, facet: true },
    { name: "material_id", type: "string[]", optional: true, reference: "materials.id" },
    { name: "media_object_id", type: "string[]", optional: true, reference: "media_objects.id" },
    { name: "name", type: "string" },
    { name: "publisher", type: "string", facet: true },
    { name: "publisher_id", type: "string", reference: "publishers.id" },
    { name: "subject", type: "string[]", optional: true, facet: true },
    { name: "subject_id", type: "string[]", optional: true, reference: "subjects.id" },
  ],
} as const satisfies CollectionCreateSchema;

export type HeritageObject = {
  id: string;
  type: string[];
  additional_type?: string[];
  additional_type_id?: string[];
  content_location?: string[];
  content_location_id?: string[];
  creator?: string[];
  creator_id?: string[];
  date_created?: string;
  dataset: string;
  dataset_id: string;
  description?: string;
  genre?: string[];
  genre_id?: string[];
  is_based_on: {
    id: string;
    type: string;
  };
  license: string;
  license_id: string;
  material?: string[];
  material_id?: string[];
  media_object_id?: string[];
  name: string;
  publisher: string;
  publisher_id: string;
  subject?: string[];
  subject_id?: string[];
};

export const licensesSchema = {
  name: "licenses",
  fields: [
    { name: "type", type: "string" },
    { name: "name", type: "string" },
    { name: "is_based_on", type: "string" },
  ],
} as const satisfies CollectionCreateSchema;

export type License = {
  id: string;
  type: string;
  name: string;
  is_based_on: string;
};

export const materialsSchema = {
  name: "materials",
  fields: [
    { name: "type", type: "string" },
    { name: "name", type: "string" },
  ],
} as const satisfies CollectionCreateSchema;

export type Material = {
  id: string;
  type: string;
  name: string;
};

export const mediaObjectsSchema = {
  name: "media_objects",
  enable_nested_fields: true,
  fields: [
    { name: "type", type: "string[]" },
    { name: "content_url", type: "string" },
    { name: "thumbnail_url", type: "string" },
    { name: "license_id", type: "string", reference: "licenses.id" },
    { name: "is_based_on", type: "object", optional: true },
    { name: "is_based_on.id", type: "string", optional: true },
    { name: "is_based_on.type", type: "string", optional: true },
    { name: "is_based_on.encoding_format", type: "string", optional: true },
  ],
} as const satisfies CollectionCreateSchema;

export type MediaObject = {
  id: string;
  type: string[];
  content_url: string;
  thumbnail_url: string;
  license_id: string;
  is_based_on?: {
    id: string;
    type: string;
    encoding_format: string;
  };
};

export const publishersSchema = {
  name: "publishers",
  fields: [
    { name: "type", type: "string" },
    { name: "name", type: "string" },
  ],
} as const satisfies CollectionCreateSchema;

export type Publisher = {
  id: string;
  type: string;
  name: string;
};

export const subjectsSchema = {
  name: "subjects",
  fields: [
    { name: "type", type: "string" },
    { name: "name", type: "string" },
  ],
} as const satisfies CollectionCreateSchema;

export type Subject = {
  id: string;
  type: string;
  name: string;
};
