# Utilities

## CLI options

`parseCliArguments()` supports long options in either `--name value` or
`--name=value` form and keeps positional arguments separate. Use
`parseCliArgs()` when positionals are invalid, then trim required values with
`getRequiredCliOption()`:

```ts
import { getRequiredCliOption, parseCliArgs } from "@/utils";

const options = parseCliArgs();
const entityId = getRequiredCliOption(options, "entity-id");
```

## MongoDB partial updates

`buildDeepSetUpdate()` converts supplied plain-object leaves to dotted `$set`
paths, avoiding replacement of sibling nested fields. `undefined` and empty
objects are omitted; arrays, dates, and other non-plain objects remain atomic.
MongoDB-unsafe key segments are rejected.

```ts
import { buildDeepSetUpdate } from "@/utils";

await UserModel.updateOne(
	{ email: "ada@example.com" },
	buildDeepSetUpdate({ profile: { displayName: "Ada" } }),
);
// { $set: { "profile.displayName": "Ada" } }
```

## Telegram notifications

`sendTelegramMessage()` reads `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` by
default. Keep these credentials in `.env`, never source control; pass
`botToken` and `chatId` only when an explicit override is needed.

```ts
import { sendTelegramMessage } from "@/utils";

await sendTelegramMessage("Nightly import completed.");
```

The helper rejects empty messages and throws when Telegram returns a non-2xx
response. Its `request` option accepts an injected transport for tests.
