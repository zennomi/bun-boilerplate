export interface DeepSetUpdate {
	$set: Record<string, unknown>;
}

const UNSAFE_PATH_SEGMENTS = new Set(["__proto__", "constructor", "prototype"]);

/**
 * Builds a non-destructive MongoDB update from supplied values.
 *
 * Plain objects are recursively expanded to dotted `$set` paths. Omitted and
 * empty-object paths are untouched; arrays and non-plain objects are atomic
 * values. MongoDB-unsafe path segments are rejected before a write.
 */
export function buildDeepSetUpdate(
	values: Readonly<Record<string, unknown>>,
): DeepSetUpdate {
	const $set: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(values)) {
		validatePathSegment(key, key);
		appendDeepSetPaths($set, key, value);
	}

	return { $set };
}

function appendDeepSetPaths(
	$set: Record<string, unknown>,
	path: string,
	value: unknown,
): void {
	if (value === undefined) return;

	if (isPlainObject(value)) {
		for (const [key, childValue] of Object.entries(value)) {
			const childPath = `${path}.${key}`;
			validatePathSegment(key, childPath);
			appendDeepSetPaths($set, childPath, childValue);
		}
		return;
	}

	$set[path] = value;
}

function validatePathSegment(segment: string, path: string): void {
	if (
		segment.length === 0 ||
		segment.includes(".") ||
		segment.startsWith("$") ||
		UNSAFE_PATH_SEGMENTS.has(segment)
	) {
		throw new Error(`Unsafe MongoDB update path: ${path}`);
	}
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return false;
	}

	const prototype = Object.getPrototypeOf(value);
	return prototype === Object.prototype || prototype === null;
}
