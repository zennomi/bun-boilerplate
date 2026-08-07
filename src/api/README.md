# API clients

This directory owns external-service clients and their client-specific response
policies. It also contains composable persistence helpers for the optional
Mongo-backed HTTP response cache.

## Public GET response cache

Set `HTTP_CACHE_TTL_SECONDS` to a positive integer before using the cache. The
cache stores the canonical URL, raw `status`, `statusText`, and body until its
expiry; it does not fetch requests or parse payloads.

```ts
import {
	findFreshHttpResponseCacheEntry,
	getPublicGetHttpResponseCacheKey,
	getRequiredHttpResponseCacheTtlSeconds,
	replaceHttpResponseCacheEntry,
} from "@/api/http-response-cache";

const requestInit = { method: "GET" } as const;
const cacheKey = getPublicGetHttpResponseCacheKey(url, requestInit);
const ttlSeconds = getRequiredHttpResponseCacheTtlSeconds();

try {
	const cached = await findFreshHttpResponseCacheEntry(cacheKey);
	if (cached) {
		return new Response(
			cached.status === 204 || cached.status === 205 ? null : cached.body,
			{ status: cached.status, statusText: cached.statusText },
		);
	}
} catch (error) {
	console.warn("HTTP cache read failed; fetching live response.", error);
}

const response = await fetch(url, requestInit);
if (response.ok) {
	try {
		await replaceHttpResponseCacheEntry(
			cacheKey,
			{
				status: response.status,
				statusText: response.statusText,
				body: await response.clone().text(),
			},
			ttlSeconds,
		);
	} catch (error) {
		console.warn("HTTP cache write failed; returning live response.", error);
	}
}
return response;
```

`getPublicGetHttpResponseCacheKey()` accepts only GET requests without
`Authorization`, `Cookie`, or `Proxy-Authorization` headers (and without
non-omitted fetch credentials). Use it only for endpoints whose URLs and
responses are genuinely public; do not put secrets in query parameters.

Each client remains responsible for choosing cacheable status codes, parsing
the body, handling cache read/write failures without masking a live response,
and designing a separate key/policy for any authenticated endpoint. Cache
entries have a unique URL index and are initialized lazily through the shared
Mongoose connection.
