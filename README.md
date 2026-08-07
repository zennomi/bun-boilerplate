# bun-boilerplate 🚀

[![forthebadge](https://forthebadge.com/images/badges/built-with-love.svg)](https://forthebadge.com) [![forthebadge](https://forthebadge.com/images/badges/for-you.svg)](https://forthebadge.com) [![forthebadge](https://forthebadge.com/images/badges/open-source.svg)](https://forthebadge.com) [![forthebadge](https://forthebadge.com/images/badges/uses-git.svg)](https://forthebadge.com) [![forthebadge](https://rajarakoto.github.io/github-docs/badge/build-by.svg)](https://forthebadge.com)

![Git](https://img.shields.io/badge/-Git-777?style=flat&logo=git&logoColor=F05032&labelColor=ffffff) ![Gitub](https://img.shields.io/badge/-Gitub-777?style=flat&logo=github&logoColor=777&labelColor=ffffff)

**Developer Ready: A comprehensive template. Works out of the box for most Bun.js projects. This project is intended to be used with the latest active LTS release of Bun.js.**

Instant Value - All basic tools included and configured:

- 🚀 Typescript >= 5.3
- 🧅 Bun.js >= 1.0.26
- 🧅 Use Bun as package manager
- 🌈 ESM
- 🧪 Biome for code formatting and linting
- 📚 Type definitions for Bun.js
- ⚙️ EditorConfig for consistent coding style
- 📦 NPM scripts for common operations
- 🛠️ Example configuration for GitHub Actions
- 📝 Simple example of TypeScript code
- 🐗 Run tasks with Grunt (example for backup)
- 🚄 Build faster
- 🖥️ Ungit for version control (git) with a GUI
- 📘 Runtime library for TypeScript helpers with tslib
- 🗃️ Utility functions for working with ts-api-utils
- 🍃 MongoDB integration with a typed user-model reference

---

### 📌 Usage

To use this template, use the following commands:

```bash
bun create github.com/RajaRakoto/bun-boilerplate <project-name>
cd <project-name>
bun run pkg-upgrade # to upgrade outdated dependencies in interactive mode
```

> NOTE 1: I employ the `MIT license` for this starter kit, which includes my name and GitHub profile. Please remember to adjust or remove it if deemed unnecessary.

> NOTE 2: In order to help you better understand the structure of this boilerplate, there is a `README.md` file in each subdirectory of src.

> NOTE 3: For certain configurations in the `package.json` file, you need to modify them to tailor them to your project (e.g: name, description, author, keywords, main, repository, ...).

---

### 🍃 MongoDB

The project uses [`mongoose`](https://www.npmjs.com/package/mongoose), a
schema-based ODM for MongoDB. Copy the environment template and configure the
database:

```bash
cp .env.example .env
# Start MongoDB locally, or replace MONGODB_URI with an Atlas URI.
```

Set both values in `.env`:

```dotenv
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=bun_boilerplate
```

`src/database/mongoose.ts` provides the shared Mongoose connection.
`src/models/model.ts` provides `defineModel()`, the reusable model-registration
helper for every new schema. `src/models/user.model.ts` is the reference model:
it uses schema validation and normalization, timestamps, a unique email index,
and create/find helpers.

```ts
import { connectDatabase } from "@/database/mongoose";
import {
	createUser,
	ensureUserIndexes,
	findUserByEmail,
} from "@/models/user.model";

await connectDatabase();
await ensureUserIndexes();

const user = await createUser({
	email: "ada@example.com",
	name: "Ada Lovelace",
});
const foundUser = await findUserByEmail(user.email);
```

Call `closeDatabase()` during graceful shutdown.

#### Optional public HTTP response cache

The starter also includes a Mongo-backed cache for public GET responses. Set a
positive `HTTP_CACHE_TTL_SECONDS` value, then use the helpers in
`src/api/http-response-cache.ts` from the API client that owns the request.
The cache canonicalizes query ordering and retains raw response metadata/body;
it deliberately does not fetch, parse, or choose cacheable status codes.

Only generate keys with `getPublicGetHttpResponseCacheKey()` for genuinely
public GETs. It rejects cookies and common authorization headers, but callers
must also avoid secrets in URLs, handle cache read/write failures gracefully,
and define a separate private-key strategy for authenticated APIs. See
[`src/api/README.md`](src/api/README.md) for a complete short example.

### 📌 NPM Scripts

**Start**

- 📜 `start` - Run your application with bun.
- 📜 `start:smol` - Run your application with bun and a flag which configures the JavaScriptCore heap size to be smaller and grow slower.
- 📜 `start:bin` - Run your standalone binary app.

**Clean**

- 📜 `clean` - Remove build artifacts.

**Development**

- 📜 `dev` - Launch your application in development mode with bun.
- 📜 `dev:watch` - Interactive watch mode to automatically transpile source files with bun in development.
- 📜 `dev:hot` - Hot reloading of source files with bun in development.
- 📜 `dev:smol:watch` - Interactive watch mode to automatically transpile source files with bun in development, while using --smol flag.
- 📜 `dev:smol:hot` - Hot reloading source files with bun in development, while using --smol flag.

**Build**

- 📜 `build` - Transpile and bundle source files with bun.
- 📜 `build:watch` - Interactive watch mode to automatically transpile source files with bun.
- 📜 `build:bin` - bun's bundler implements a --compile flag for generating a standalone binary from a TypeScript or JavaScript file, use this in your production environment to ensure optimal execution of your app.

**Linting and Formatting**

- 📜 `biome:start` - Starts the Biome daemon server. You can specify a custom configuration file path using the `--config-path` option.
- 📜 `biome:stop` - Stops the Biome daemon server.
- 📜 `biome:fix` - Runs a source code check and applies automatic fixes (linter & formatter) according to the defined rules.
- 📜 `biome:unsafe` - Works like `biome:fix`, but may apply more invasive or risky changes.

**Backup and Dependency Management**

- 📜 `backup` - Backup files with Grunt.
- 📜 `pkg-check` - Check useless dependencies with depcheck.
- 📜 `pkg-upgrade` - Upgrade outdated dependencies (interactive mode) with npm-check-updates.

**Versioning**

- 📜 `versioning` - Start ungit server.

**NPM Commands**

- 📜 `npm-version:major` - Increments the major version number of your project using npm.
- 📜 `npm-version:minor` - Increments the minor version number of your project using npm.
- 📜 `npm-version:patch` - Increments the version patch number of your project using npm.

---

### 📌 Build

When using the **build.js** file in this boilerplate, it's important to note the significance of the **target** option. By default, if the target option is not specified in the **build.js** file, it will be set to `browser`. However, for projects utilizing the `bun.js` runtime environment, it's imperative to explicitly set the target to `bun`. This guarantees compatibility with the `bun` shell environment and prevents unexpected behavior. Furthermore, it's noteworthy that the `target` supports three possible values: `browser`, `bun`, and `node`, providing flexibility in defining the build target according to specific project requirements.

---

### 📌 Similar

You can also check out my other starter projects:

- 🚀 [node-boilerplate](https://github.com/RajaRakoto/node-boilerplate)
- 🚀 [react-boilerplate](https://github.com/RajaRakoto/react-boilerplate)
- 🚀 [next-boilerplate](https://github.com/RajaRakoto/next-boilerplate)
- 🚀 [qwik-boilerplate](https://github.com/RajaRakoto/qwik-boilerplate)
- 🚀 [vscode-boilerplate](https://github.com/RajaRakoto/vscode-boilerplate)
- 🚀 [cli-boilerplate](https://github.com/RajaRakoto/cli-boilerplate)
