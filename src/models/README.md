# Models

Each model module owns its schema, public input/document types, indexes, and
model-specific query helpers. `user.model.ts` is the reference implementation.

Use `defineModel()` from `model.ts` for every new schema. It caches a registered
Mongoose model by name, preventing `OverwriteModelError` during module reloads
while keeping model declarations consistent:

```ts
import { Schema } from "mongoose";

import { defineModel } from "./model";

interface Post {
	title: string;
}

const PostSchema = new Schema({
	title: { type: String, required: true, trim: true },
});

export const PostModel = defineModel<Post>("Post", PostSchema);
```

`http-response-cache.model.ts` is an optional generic model for public HTTP
cache entries. It uses the same factory, owns the `http_response_cache`
collection, and declares a unique canonical-URL index. Call
`ensureHttpResponseCacheIndexes()` through the API cache helpers rather than
creating that index manually.
