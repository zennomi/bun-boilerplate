import { connectDatabase } from "@/database/mongoose";
import {
	ensureHttpResponseCacheIndexes,
	HttpResponseCacheModel,
	type HttpResponseCacheRecord,
} from "@/models/http-response-cache.model";

export interface CachedHttpResponse {
	status: number;
	statusText: string;
	body: string;
}

const PRIVATE_REQUEST_HEADERS = [
	"authorization",
	"cookie",
	"proxy-authorization",
] as const;
const INVALID_TTL_ERROR =
	"HTTP_CACHE_TTL_SECONDS must be set to a positive integer before using the HTTP response cache.";

let initializationPromise: Promise<void> | undefined;

/**
 * Creates a stable cache key for an HTTP URL.
 *
 * Query parameters are sorted by name and value, so equivalent query ordering
 * shares an entry while repeated parameters remain distinct. URL fragments are
 * not sent to servers and are excluded from the key.
 */
export function canonicalizeHttpResponseCacheUrl(input: string | URL): string {
	const url = new URL(input);
	url.hash = "";

	const queryEntries = [...url.searchParams.entries()].sort(
		([leftName, leftValue], [rightName, rightValue]) =>
			leftName.localeCompare(rightName) || leftValue.localeCompare(rightValue),
	);
	url.search = new URLSearchParams(queryEntries).toString();

	return url.href;
}

/**
 * Returns whether an init object is safe for the starter's public GET cache.
 * Custom credentials embedded in other headers or URL query parameters remain
 * the caller's responsibility.
 */
export function isPublicGetHttpResponseCacheRequest(
	requestInit: Pick<RequestInit, "credentials" | "headers" | "method"> = {},
): boolean {
	if ((requestInit.method ?? "GET").toUpperCase() !== "GET") return false;
	if (requestInit.credentials && requestInit.credentials !== "omit")
		return false;

	const headers = new Headers(requestInit.headers);
	return PRIVATE_REQUEST_HEADERS.every(
		(headerName) => !headers.has(headerName),
	);
}

/**
 * Validates a public GET request and returns its canonical cache key.
 *
 * This intentionally rejects known credential-bearing requests to prevent
 * accidental cross-user caching. It does not perform a fetch or cache I/O.
 */
export function getPublicGetHttpResponseCacheKey(
	input: string | URL,
	requestInit: Pick<RequestInit, "credentials" | "headers" | "method"> = {},
): string {
	if (!isPublicGetHttpResponseCacheRequest(requestInit)) {
		throw new Error(
			"HTTP response cache only supports public GET requests without credentials or cookies.",
		);
	}

	return canonicalizeHttpResponseCacheUrl(input);
}

/** Reads the required response-cache lifetime in seconds. */
export function getRequiredHttpResponseCacheTtlSeconds(): number {
	const value = process.env.HTTP_CACHE_TTL_SECONDS?.trim();

	if (!value || !/^\d+$/.test(value)) {
		throw new Error(INVALID_TTL_ERROR);
	}

	const seconds = Number(value);
	const maximumTtlSeconds = Math.floor(
		(8_640_000_000_000_000 - Date.now()) / 1_000,
	);
	if (
		!Number.isSafeInteger(seconds) ||
		seconds <= 0 ||
		seconds > maximumTtlSeconds
	) {
		throw new Error(INVALID_TTL_ERROR);
	}

	return seconds;
}

/** Finds an entry that remains fresh at the supplied time. */
export async function findFreshHttpResponseCacheEntry(
	url: string,
	now = new Date(),
): Promise<CachedHttpResponse | undefined> {
	await initializeHttpResponseCache();

	const entry = await HttpResponseCacheModel.findOne({
		url,
		expiresAt: { $gt: now },
	}).exec();
	if (!entry) return undefined;

	return {
		status: entry.status,
		statusText: entry.statusText,
		body: entry.body,
	};
}

/**
 * Replaces the entry for a URL after a caller-selected cacheable live response.
 * Expired entries remain until a later replacement occurs.
 */
export async function replaceHttpResponseCacheEntry(
	url: string,
	response: CachedHttpResponse,
	ttlSeconds: number,
	now = new Date(),
): Promise<void> {
	await initializeHttpResponseCache();

	const entry: HttpResponseCacheRecord = {
		url,
		status: response.status,
		statusText: response.statusText,
		body: response.body,
		createdAt: now,
		expiresAt: getHttpResponseCacheExpiry(ttlSeconds, now),
	};

	await HttpResponseCacheModel.findOneAndUpdate(
		{ url },
		{ $set: entry },
		{ upsert: true },
	).exec();
}

function getHttpResponseCacheExpiry(ttlSeconds: number, now: Date): Date {
	if (!Number.isSafeInteger(ttlSeconds) || ttlSeconds <= 0) {
		throw new Error("HTTP cache TTL must be a positive safe integer.");
	}

	const expiresAt = new Date(now.getTime() + ttlSeconds * 1_000);
	if (Number.isNaN(now.getTime()) || Number.isNaN(expiresAt.getTime())) {
		throw new Error("HTTP cache TTL produces an invalid cache expiry.");
	}

	return expiresAt;
}

async function initializeHttpResponseCache(): Promise<void> {
	if (initializationPromise) return initializationPromise;

	initializationPromise = (async () => {
		await connectDatabase();
		await ensureHttpResponseCacheIndexes();
	})().catch((error: unknown) => {
		initializationPromise = undefined;
		throw error;
	});

	return initializationPromise;
}
