# create-automovie

Create a blank AutoMovie authoring repository with an explicit production language:

```bash
npx create-automovie my-film --language korean
```

Choose `chinese`, `english`, `japanese`, or `korean`; omission is an error, not a default language. This package delegates to `automovie`, so the command is equivalent to `npx automovie start my-film --language korean` with the same arguments.

Install dependencies in the created directory and run `npm run lint` and `npm run evidence` for the independent source and authored-graph checks. Follow the installed `AGENTS.md` before design, compilation, or capture. The [CLI README](../cli/README.md#generated-project-routes) owns those entry routes and prerequisites.

## Development checks

`pnpm run build` compiles with source correctness lint. `pnpm run evidence` independently checks the configured contract graph with `@wrtnlabs/evidence`, then runs the existing native source evidence guards.
