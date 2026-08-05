import { describe, expect, test } from "bun:test";

import { UserModel } from "@/models/user.model";

describe("UserModel", () => {
	test("normalizes email and name through the schema", () => {
		const user = new UserModel({
			email: "  ADA@EXAMPLE.COM ",
			name: " Ada Lovelace ",
		});

		expect(user.email).toBe("ada@example.com");
		expect(user.name).toBe("Ada Lovelace");
	});

	test("requires a non-empty email and name", () => {
		const missingEmail = new UserModel({ email: "  ", name: "Ada" });
		const missingName = new UserModel({ email: "ada@example.com", name: "  " });

		expect(missingEmail.validateSync()?.errors.email?.message).toBe(
			"A user email is required.",
		);
		expect(missingName.validateSync()?.errors.name?.message).toBe(
			"A user name is required.",
		);
	});
});
