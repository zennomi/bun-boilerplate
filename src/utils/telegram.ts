const TELEGRAM_MESSAGE_MAX_LENGTH = 4_096;

export type TelegramRequest = (
	url: string,
	init: RequestInit,
) => Promise<Pick<Response, "ok" | "status">>;

export interface SendTelegramMessageOptions {
	botToken?: string;
	chatId?: string;
	request?: TelegramRequest;
}

/** Sends a Telegram Bot API message using configured bot and chat credentials. */
export async function sendTelegramMessage(
	message: string,
	options: SendTelegramMessageOptions = {},
): Promise<void> {
	const botToken = (options.botToken ?? process.env.TELEGRAM_BOT_TOKEN)?.trim();
	const chatId = (options.chatId ?? process.env.TELEGRAM_CHAT_ID)?.trim();
	if (!botToken || !chatId) {
		throw new Error(
			"TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set to send a Telegram message.",
		);
	}
	if (!message.trim()) throw new Error("Telegram message must not be empty.");

	const request = options.request ?? ((url, init) => fetch(url, init));
	const response = await request(
		`https://api.telegram.org/bot${encodeURIComponent(botToken)}/sendMessage`,
		{
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				chat_id: chatId,
				text: message.slice(0, TELEGRAM_MESSAGE_MAX_LENGTH),
			}),
		},
	);
	if (!response.ok) {
		throw new Error(
			`Telegram message request failed with status ${response.status}.`,
		);
	}
}
