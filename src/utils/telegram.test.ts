import { expect, test } from "bun:test";

import { sendTelegramMessage } from "./telegram";

test("sends a Telegram message with explicit credentials", async () => {
	let requestUrl = "";
	let requestInit: RequestInit | undefined;

	await sendTelegramMessage("Crawler failed.", {
		botToken: "bot:token",
		chatId: "123",
		request: async (url, init) => {
			requestUrl = url;
			requestInit = init;
			return { ok: true, status: 200 };
		},
	});

	expect(requestUrl).toBe(
		"https://api.telegram.org/botbot%3Atoken/sendMessage",
	);
	expect(requestInit).toMatchObject({
		method: "POST",
		headers: { "content-type": "application/json" },
	});
	expect(JSON.parse(requestInit?.body as string)).toEqual({
		chat_id: "123",
		text: "Crawler failed.",
	});
});

test("Telegram validation rejects missing credentials and empty messages", async () => {
	await expect(
		sendTelegramMessage("Crawler failed.", { botToken: "", chatId: "" }),
	).rejects.toThrow("TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID");
	await expect(
		sendTelegramMessage("  ", { botToken: "token", chatId: "123" }),
	).rejects.toThrow("Telegram message must not be empty");
});

test("Telegram requests truncate long messages and report non-2xx responses", async () => {
	let text = "";
	await sendTelegramMessage("a".repeat(4_100), {
		botToken: "token",
		chatId: "123",
		request: async (_url, init) => {
			text = JSON.parse(init.body as string).text;
			return { ok: true, status: 200 };
		},
	});
	expect(text).toHaveLength(4_096);

	await expect(
		sendTelegramMessage("Crawler failed.", {
			botToken: "token",
			chatId: "123",
			request: async () => ({ ok: false, status: 401 }),
		}),
	).rejects.toThrow("status 401");
});
