import { Schema } from "mongoose";

import { defineModel } from "./model";

export const HTTP_RESPONSE_CACHE_COLLECTION = "http_response_cache";
export const HTTP_RESPONSE_CACHE_MODEL_NAME = "HttpResponseCache";

/** A persisted public HTTP response available until its configured expiry. */
export interface HttpResponseCacheRecord {
	url: string;
	status: number;
	statusText: string;
	body: string;
	createdAt: Date;
	expiresAt: Date;
}

export const HttpResponseCacheSchema = new Schema(
	{
		url: {
			type: String,
			required: [true, "A cache URL is required."],
			trim: true,
		},
		status: {
			type: Number,
			required: [true, "A cache response status is required."],
		},
		statusText: { type: String, default: "" },
		body: { type: String, default: "" },
		createdAt: {
			type: Date,
			required: [true, "A cache creation time is required."],
		},
		expiresAt: {
			type: Date,
			required: [true, "A cache expiry time is required."],
		},
	},
	{
		collection: HTTP_RESPONSE_CACHE_COLLECTION,
		versionKey: false,
	},
);

HttpResponseCacheSchema.index(
	{ url: 1 },
	{ name: "http_response_cache_url_unique", unique: true },
);

/** Mongoose model for reusable public HTTP response cache entries. */
export const HttpResponseCacheModel = defineModel<HttpResponseCacheRecord>(
	HTTP_RESPONSE_CACHE_MODEL_NAME,
	HttpResponseCacheSchema,
);

/** Ensures the response-cache indexes are available before cache access. */
export async function ensureHttpResponseCacheIndexes(): Promise<void> {
	await HttpResponseCacheModel.init();
}
