# {{name}}

This is an AutoMovie production project. Author production documents, TypeScript and assets as tracked files; execution consumes typed source directly.

## Authoring routes

`AGENTS.md` is the shared agent entry point. [3D modeling](.agents/skills/3d-modeling/SKILL.md) covers modeling and visual debugging. [Production documents](docs/README.md) maps document owners. Use installed package README, public types, JSDoc and diagnostics for APIs and validation.

## Static-document updates

Installation is one-way. Instructions, contracts, configuration and source become project-owned files. Package upgrades do not overwrite them; adopt updates through reviewed edits while preserving authored content.

## First run

```bash
npm install --package-lock=false
npm run lint
npm run evidence
```

Select the production kind in `lint.config.ts` and author its required inputs. The blank project is intentionally incomplete.

## Canonical command routes

| Command | Purpose |
| --- | --- |
| `npm run lint` | TypeScript and source correctness |
| `npm run evidence` | Declared production graph and source guards |
| `npm run format` | Source formatting |

Use installed `automovie` help for external-asset inspection and capability routes. The scaffold supplies no production content, viewer stub or capture/render command. Author required runtime/view code through public package APIs.

The project uses ES modules with `verbatimModuleSyntax` and `isolatedModules`. Mark type imports and exports with `type`; runtime imports and exports retain their written module syntax. The compiler rejects type-only value imports and code that cannot be transformed one file at a time, keeping Node execution and browser bundlers consistent. These options preserve full-program type checking and the configured source-correctness plugins in `npm run lint`.

## Ownership

- `src` holds executable source, including viewer and command entries.
- `public` holds HTML and static assets.
- `docs` holds production facts, contracts and observations; Git holds history.
- `lint.config.ts` is the sole typed production/evidence declaration. Compiler settings stay in their declared configuration files.
- `evidence.config.ts` derives the standalone graph from that declaration and is selected by the normal evidence command.
- `package.json` owns dependencies and commands. Keep inputs typed and outputs separate from source.

Use the production's actual source for rendering and measurement. Validate and inspect the requested result before reporting completion.
