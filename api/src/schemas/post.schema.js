const postBaseSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  additionalProperties: false,
  properties: {
    slug: { type: "string", pattern: "^[a-z0-9]+(-[a-z0-9]+)*$", maxLength: 120 },
    title: { type: "string", minLength: 5, maxLength: 160 },
    author: { type: "string", minLength: 2, maxLength: 80 },
    category: { type: "string", minLength: 2, maxLength: 60 },
    tags: {
      type: "array",
      items: { type: "string", minLength: 1, maxLength: 40 },
      minItems: 1,
      maxItems: 15,
    },
    body: { type: "string", minLength: 10, maxLength: 2000 },
    summary: { type: "string", minLength: 10, maxLength: 400 },
    description: { type: "string", minLength: 10, maxLength: 400 },
    content: { type: "string", minLength: 50 },
    coverImage: { type: "string", pattern: "^https?://" },
    datePublished: {
      type: "string",
      pattern: "^\\d{4}-\\d{2}-\\d{2}(T\\d{2}:\\d{2}:\\d{2}(\\.\\d{3})?Z?)?$",
    },
    dateModified: {
      type: "string",
      pattern: "^\\d{4}-\\d{2}-\\d{2}(T\\d{2}:\\d{2}:\\d{2}(\\.\\d{3})?Z?)?$",
    },
    readTime: { type: "string" },
    dated: { type: "string" },
    categorySlug: { type: "string" },
    status: { enum: ["draft", "review", "published"] },
  },
};

const createSchema = {
  ...postBaseSchema,
  required: ["title", "category", "tags", "summary", "description", "body", "content"],
};

const updateSchema = {
  ...postBaseSchema,
  required: [],
};

const publishSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  additionalProperties: false,
  properties: {
    datePublished: postBaseSchema.properties.datePublished,
    dateModified: postBaseSchema.properties.dateModified,
  },
  required: [],
};

module.exports = { createSchema, updateSchema, publishSchema };
