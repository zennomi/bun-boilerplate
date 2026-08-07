---
root: true
targets: ["*"]
description: "Project overview and general development guidelines"
globs: ["**/*"]
---

# bun-boilerplate contributor guide

## Toolchain and commands

Use Bun (the package manager and runtime); `package.json` requires Bun >= 1.0.26.

| Task | Command |
| --- | --- |
| Install dependencies | `bun install` |
| Run the development entry point | `bun run dev` |
| Run with file watching / hot reload | `bun run dev:watch` / `bun run dev:hot` |
| Build the distributable | `bun run build` |
| Run the built JavaScript | `bun run start` |
| Type-check (there is no package script) | `bunx tsc --noEmit` |
| Check formatting and lint rules | `bunx biome check .` |
| Apply safe Biome fixes | `bun run biome:fix` |

`bun run build` first removes `build`, `dist`, and `coverage`; do not use it when those uncommitted generated artifacts must be retained. `bun run start` expects the preceding build to have created `dist/index.js`.

## Architecture

This is a small Bun + TypeScript ESM starter, not an application framework. Runtime flow is:

1. `src/index.ts` is the runnable development entry point.
2. `build.js` calls `Bun.build` with that entry point, targeting Bun, minifying it, writing an external source map, and using `bun-plugin-dts` to emit declarations.
3. The build output is `dist/`; package consumers use `dist/index.js` and `dist/index.d.ts` as declared in `package.json`.

`tsconfig.json` is strictly a type-checking configuration (`noEmit: true`), so it does not produce the package artifacts. It uses ESM, bundler module resolution, strict checking, and the `@/*` alias for `src/*`.

Source module boundaries are intentionally light:

- `src/constants/` holds shared constant values.
- `src/utils/` holds reusable utility functions.
- `src/api/` is reserved for external-service clients; it currently contains documentation only.
- `src/@types/` holds exported shared TypeScript types and interfaces.

## Project-specific configuration

- `biome.json` is the formatter/linter configuration. It specifies tabs, double quotes, semicolons, trailing commas, and an 80-column line width; this overrides the root EditorConfig indentation preference for code formatted by Biome.
- `.env.example` is only a template in the starter. No current source file loads or consumes these variables.
- `build.js` is the place to change the package build target, entry point, declaration generation, or optional compiled-binary/shebang behavior. The `build:bin` script is a separate Bun `--compile` path and outputs `dist/bun-boilerplate`.
- Generated `dist/`, `build/`, coverage, backups, and temporary files are ignored by Git.
