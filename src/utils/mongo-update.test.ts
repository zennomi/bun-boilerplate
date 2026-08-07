import { expect, test } from "bun:test";

import { buildDeepSetUpdate } from "./mongo-update";

test("buildDeepSetUpdate recursively sets supplied leaves only", () => {
	const update = buildDeepSetUpdate({
		address: "0x123",
		entity: { id: "entity-1", type: null },
		label: {},
		raw: {
			metadata: { name: "Updated name" },
			transfers: ["first", "second"],
		},
	});

	expect(update).toEqual({
		$set: {
			address: "0x123",
			"entity.id": "entity-1",
			"entity.type": null,
			"raw.metadata.name": "Updated name",
			"raw.transfers": ["first", "second"],
		},
	});
});

test("buildDeepSetUpdate omits undefined and empty-object paths", () => {
	expect(buildDeepSetUpdate({ label: undefined, raw: { empty: {} } })).toEqual({
		$set: {},
	});
});

test("buildDeepSetUpdate treats arrays and dates as atomic values", () => {
	const values = [{ nested: "value" }];
	const updatedAt = new Date("2025-01-01T00:00:00.000Z");

	expect(buildDeepSetUpdate({ raw: { values, updatedAt } })).toEqual({
		$set: { "raw.values": values, "raw.updatedAt": updatedAt },
	});
});

test("buildDeepSetUpdate rejects unsafe MongoDB path segments", () => {
	expect(() => buildDeepSetUpdate({ raw: { "not.safe": true } })).toThrow(
		"Unsafe MongoDB update path: raw.not.safe",
	);
	expect(() => buildDeepSetUpdate({ raw: { $value: true } })).toThrow(
		"Unsafe MongoDB update path: raw.$value",
	);
	expect(() =>
		buildDeepSetUpdate({ raw: JSON.parse('{"__proto__":true}') }),
	).toThrow("Unsafe MongoDB update path: raw.__proto__");
});
