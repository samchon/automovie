# @automovie/evidence

Turns a production's typed declaration (its kind, population scope, and branch stages) into the evidence graph `@wrtnlabs/evidence` checks. It validates the project's physical documents and source populations before returning a configuration; the production keeps its decisions and content in its own files. Its observation types describe caller-supplied authoring identity consumed by `@automovie/production`.

## Use

```bash
npm install --save-dev @automovie/evidence
```

For the production graph factory, supply an `IAutoMovieEvidenceConfigProps` declaration with the project's absolute location, selected kind and language, population scope, and complete stage map. The project must already own the required documents under `docs/discovery`, `docs/naturalness`, `docs/obligations`, `docs/principles`, and `docs/upstream`, plus the selected language pack at `docs/language`. Language selection admits an identity; it does not create those documents. The current blank template supplies source lint and declaration checklists, and does not install these production contract packs.

## Executed setup

This checkout's [evidence.config.ts](./evidence.config.ts) is a complete standalone declaration over exported source and the repository's common and performance checklists. From the repository root, use its existing dependency installation and normal Evidence command:

```bash
pnpm install
pnpm --filter @automovie/evidence evidence
```

That declaration's relative target root points into this repository's `.agents/skills`; a consumer owns its own target documents and must select their actual root. It demonstrates native declaration evaluation, while the production factory additionally admits the resident contracts, language pack and authored populations described above.

## Public surface

| Export | Purpose |
| --- | --- |
| `createAutoMovieEvidenceConfig`, `createAutoMovieStandaloneEvidenceConfig` | Validate the declaration and build the graph the evidence CLI evaluates |
| `createAutoMovieProductionPrincipleClaim`, `createAutoMovieProductionObligationClaim` | Add a production's own checklist or obligation to its graph |
| `parseAutoMovieEvidenceSyntax`, `projectAutoMovieAuthoredMarkdown`, `projectAutoMovieMarkdownSyntax` | Select structural carriers and preserve their authored-body boundary |
| `readAutoMovieContractRules`, `selectAutoMovieContractRules` | Read structured project-owned rules and select declared status and safe application |
| `createAutoMovieRetainedPilotHost`, `validateAutoMoviePopulationTransition` | Record supplied body and declaration identities and validate a reset receipt |
| `IAutoMovieProductionEvidence` and its owner-binding types | Describe caller-supplied observations consumed by production admission; these types acquire no graph or files |
