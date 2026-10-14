# {{name}}

An AutoMovie production. Author assets, their performance, and the code that views or renders them as TypeScript under `src`, using the installed AutoMovie packages.

## First run

```bash
npm install --package-lock=false
npm run lint
npm run evidence
```

The blank project contains no production content.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run lint` | TypeScript and source correctness |
| `npm run evidence` | Checklist answers of every exported declaration under `src` |
| `npm run format` | Source formatting |

The project uses ES modules with `verbatimModuleSyntax` and `isolatedModules`: mark type-only imports and exports with `type`, and keep each file transformable on its own.

## Ownership

- `src` holds executable source, including viewer and command entries; `public` holds HTML and static assets.
- `lint.config.ts` configures source lint; `evidence.config.ts` selects the checklist in `.agents/skills/contracts`.
- `package.json` owns dependencies, commands, and compiler settings.
- Installation is one-way: these files are project-owned, and package upgrades never overwrite them.
