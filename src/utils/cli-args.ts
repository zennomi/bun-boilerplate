export interface ParsedCliArgs {
	options: ReadonlyMap<string, string>;
	positionals: readonly string[];
}

/** Parses long CLI options and positional arguments. */
export function parseCliArguments(
	argumentsToParse: readonly string[] = process.argv.slice(2),
): ParsedCliArgs {
	const options = new Map<string, string>();
	const positionals: string[] = [];

	for (let index = 0; index < argumentsToParse.length; index += 1) {
		const argument = argumentsToParse[index];

		if (!argument.startsWith("--") || argument === "--") {
			positionals.push(argument);
			continue;
		}

		const separatorIndex = argument.indexOf("=");
		const optionName = argument.slice(
			2,
			separatorIndex === -1 ? undefined : separatorIndex,
		);

		if (!/^[a-z][a-z0-9-]*$/.test(optionName)) {
			throw new Error(`Invalid option name: ${argument}`);
		}
		if (options.has(optionName)) {
			throw new Error(`Duplicate option: --${optionName}`);
		}

		const inlineValue =
			separatorIndex === -1 ? undefined : argument.slice(separatorIndex + 1);
		const nextValue = argumentsToParse[index + 1];
		const value = inlineValue ?? nextValue;

		if (!value || value.startsWith("--")) {
			throw new Error(`Missing value for option: --${optionName}`);
		}

		if (inlineValue === undefined) index += 1;
		options.set(optionName, value);
	}

	return { options, positionals };
}

/** Parses long CLI options and rejects positional arguments. */
export function parseCliArgs(
	argumentsToParse: readonly string[] = process.argv.slice(2),
): ReadonlyMap<string, string> {
	const { options, positionals } = parseCliArguments(argumentsToParse);

	if (positionals.length > 0) {
		throw new Error(`Unexpected positional argument: ${positionals[0]}`);
	}

	return options;
}

/** Returns a trimmed, non-empty required option value. */
export function getRequiredCliOption(
	options: ReadonlyMap<string, string>,
	optionName: string,
): string {
	const value = options.get(optionName)?.trim();

	if (!value) throw new Error(`Missing required option: --${optionName}`);

	return value;
}
