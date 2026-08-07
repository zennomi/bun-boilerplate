import { expect, test } from "bun:test";

import {
	canonicalizeHttpResponseCacheUrl,
	getPublicGetHttpResponseCacheKey,
	getRequiredHttpResponseCacheTtlSeconds,
	isPublicGetHttpResponseCacheRequest,
} from "./http-response-cache";

test("canonicalizeHttpResponseCacheUrl sorts query entries and removes hashes", () => {
	expect(
		canonicalizeHttpResponseCacheUrl(
			"https://example.com/items?z=1&a=2&a=1#section",
		),
	).toBe("https://example.com/items?a=1&a=2&z=1");
});

test("public GET cache keys reject known credential-bearing requests", () => {
	expect(isPublicGetHttpResponseCacheRequest({ method: "GET" })).toBe(true);
	expect(
		isPublicGetHttpResponseCacheRequest({
			headers: { authorization: "Bearer secret" },
		}),
	).toBe(false);
	expect(isPublicGetHttpResponseCacheRequest({ credentials: "include" })).toBe(
		false,
	);
	expect(
		isPublicGetHttpResponseCacheRequest({
			method: "POST",
		}),
	).toBe(false);
	expect(() =>
		getPublicGetHttpResponseCacheKey("https://example.com/items", {
			headers: { cookie: "session=secret" },
		}),
	).toThrow("only supports public GET requests");
});

test("public GET cache keys use the canonical URL", () => {
	expect(
		getPublicGetHttpResponseCacheKey(
			"https://example.com/items?b=2&a=1#ignored",
		),
	).toBe("https://example.com/items?a=1&b=2");
});

test("getRequiredHttpResponseCacheTtlSeconds validates the environment", () => {
	const originalValue = process.env.HTTP_CACHE_TTL_SECONDS;

	try {
		process.env.HTTP_CACHE_TTL_SECONDS = "60";
		expect(getRequiredHttpResponseCacheTtlSeconds()).toBe(60);

		process.env.HTTP_CACHE_TTL_SECONDS = "0";
		expect(() => getRequiredHttpResponseCacheTtlSeconds()).toThrow(
			"HTTP_CACHE_TTL_SECONDS",
		);
	} finally {
		if (originalValue === undefined) {
			process.env.HTTP_CACHE_TTL_SECONDS = undefined;
		} else {
			process.env.HTTP_CACHE_TTL_SECONDS = originalValue;
		}
	}
});
