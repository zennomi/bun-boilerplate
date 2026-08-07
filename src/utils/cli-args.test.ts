import { expect, test } from "bun:test";

import {
	getRequiredCliOption,
	parseCliArgs,
	parseCliArguments,
} from "./cli-args";

test("parseCliArguments accepts long options and positionals", () => {
	const parsed = parseCliArguments([
		"--entity-id",
		"wintermute",
		"--limit=50",
		"export.csv",
	]);

	expect([...parsed.options]).toEqual([
		["entity-id", "wintermute"],
		["limit", "50"],
	]);
	expect(parsed.positionals).toEqual(["export.csv"]);
});

test("parseCliArgs rejects unexpected positional arguments", () => {
	expect(() => parseCliArgs(["--limit", "50", "export.csv"])).toThrow(
		"Unexpected positional argument: export.csv",
	);
});

test("CLI parsing validates names, duplicate options, and values", () => {
	expect(() => parseCliArguments(["--Bad", "value"])).toThrow(
		"Invalid option name",
	);
	expect(() => parseCliArguments(["--limit", "1", "--limit=2"])).toThrow(
		"Duplicate option: --limit",
	);
	expect(() => parseCliArguments(["--limit", "--other", "value"])).toThrow(
		"Missing value for option: --limit",
	);
});

test("getRequiredCliOption returns trimmed values and rejects blanks", () => {
	const options = new Map([
		["entity-id", "  wintermute  "],
		["blank", "  "],
	]);

	expect(getRequiredCliOption(options, "entity-id")).toBe("wintermute");
	expect(() => getRequiredCliOption(options, "blank")).toThrow(
		"Missing required option: --blank",
	);
});
