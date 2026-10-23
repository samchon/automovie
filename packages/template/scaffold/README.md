# {{name}}

Make a standalone 3D asset, a short video, or a long film or series. Keep authored TypeScript under `src` and fixed media under `public`; choose the planning depth and tools the production needs.

## First run

```bash
npm install --package-lock=false
npm run lint
npm run evidence
npm test
```

The blank project contains instructions, contracts, and production-owned workflow helpers, with no story, models, viewer, render host, or media provider selected. The default `lint.config.ts` and `evidence.config.ts` check ordinary TypeScript source and tests. Start with the [production skill](.agents/skills/production/SKILL.md); select the optional [narrative profile](workflow/README.md#configure-the-production) only for video writing. Long productions retain settings → treatments → scripts → final screenplay; short videos enter at final screenplay; asset-only work keeps the engineering baseline and adopts its actual asset duties. Passing checks on an empty harness does not complete a production.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run lint` | TypeScript and source correctness |
| `npm run evidence` | Source/test checklists and the selected production path's active evidence obligations |
| `npm run production:check -- --layer <layer> --pass <pass>` | After narrative opt-in, current pass structure and prerequisites; see [workflow](workflow/README.md) |
| `npm test` | Every exported `test_*` function under `test`; passes when there is none |
| `npm run format` | Source formatting |

The project uses ES modules with `verbatimModuleSyntax` and `isolatedModules`: mark type-only imports and exports with `type`, and keep each file transformable on its own.

## Working files

- `src` holds executable source, including viewer and command entries; `test` holds tests and their runner; `public` holds HTML and fixed media.
- `docs` holds production decisions and working documents when needed; `docs/guides` holds the shipped manuals.
- `workflow` holds this production's evidence factory and pass checks, adapted from the four-layer authoring architecture. Its [notice](workflow/LICENSE) preserves upstream provenance.
- `lint.config.ts` configures source lint; `evidence.config.ts` selects the checklists in `.agents/skills/contracts`.
- `package.json` owns dependencies, commands, and compiler settings.
- Installation is one-way: these files are project-owned, and package upgrades never overwrite them.

Use the [production guide](docs/guides/production.md) to choose or change the layout, [storytelling](docs/guides/storytelling.md) for long narrative work, [assets](docs/guides/assets.md) for modeling and acquisition, [audio](docs/guides/audio.md) for provider choices, and [contracts](docs/guides/contracts.md) for evidence scope. Installed package READMEs, public types, and JSDoc remain the API reference. Add viewer or host dependencies only when the chosen output needs them.
