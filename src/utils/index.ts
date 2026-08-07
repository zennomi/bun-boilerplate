export {
	getRequiredCliOption,
	parseCliArgs,
	parseCliArguments,
} from "./cli-args";
export type { ParsedCliArgs } from "./cli-args";
export { buildDeepSetUpdate } from "./mongo-update";
export type { DeepSetUpdate } from "./mongo-update";
export { sendTelegramMessage } from "./telegram";
export type {
	SendTelegramMessageOptions,
	TelegramRequest,
} from "./telegram";

export function getTodayDate(): string | undefined {
	const today = new Date();
	return today.toISOString().split("T")[0];
}
