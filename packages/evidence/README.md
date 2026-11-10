# @automovie/evidence

Compose native Evidence claims for engineering and optional narrative work. Each production owns its instructions, contracts, creative bodies, evidence and independent reviews.

## Configuration

Export one configuration from `evidence.config.ts`:

```ts
import { createEvidenceConfig } from "@automovie/evidence";

export default createEvidenceConfig({ location: import.meta.dirname });
```

The default selects exported source types, interfaces and classes under `src/**/*.ts` against `.agents/skills/contracts/development/design.md`, exported source functions and class methods against `contracts/development/implementation.md`, and exported test functions under `test/**/test_*.ts` against `contracts/development/testing.md`; every one of them also answers `contracts/development/common.md`. It selects no narrative. Location is the absolute project directory; native Evidence resolves selected inputs relative to the authored configuration.

A production in a pnpm workspace whose root holds one shared `.agents/skills` tree passes that tree's absolute directory as `skills`:

```ts
import { createEvidenceConfig } from "@automovie/evidence";
import { resolve } from "node:path";

export default createEvidenceConfig({
  location: import.meta.dirname,
  skills: resolve(import.meta.dirname, "../../../.agents/skills"),
});
```

The bundled contracts resolve under `skills`: `contracts/development/**` for the engineering and development claims, and `contracts/story/shared/**` for research and the shared narrative contracts. The production's own contracts never live in a skills tree: `work/**` and `language/**` always resolve under `<location>/docs/contracts`, so `work/discovery/results.md` is `docs/contracts/work/discovery/results.md`. Citation addresses (`contracts/development/...`, `shared/...`, `work/...`, `language/...`) are the same in both layouts; only reference roots change. A production that still has `.agents/skills/contracts/story/work` or `.agents/skills/contracts/story/language` is refused with an error naming each directory and its new home under `docs/contracts`; move them there, because nothing reads the old location. `skills` must be absolute and defaults to `<location>/.agents/skills`, the standalone layout. Engineering, development and research helpers used directly take the same tree as `skills`, a root relative to `evidence.config.ts`, defaulting to `.agents/skills`: `createEngineeringClaims({ skills })`, `createDevelopmentContractClaims(stages, { skills })` and `createResearchClaims({ skills })`.

A production whose checklists predate that layout keeps them by passing `claims: createEngineeringClaims({ common: null, design: "contracts/common.md", implementation: "contracts/common.md", tests: "contracts/testing.md" })`.

Add narrative when commissioned:

```ts
export default createEvidenceConfig({
  location: import.meta.dirname,
  narrative: {
    mode: "short",
    construction: { brief: "evidence", screenplay: "evidence" },
    naturalness: { screenplay: "evidence" },
  },
});
```

Use `short` for brief canon under `docs/body/brief` plus screenplay, `short-with-settings` for compact settings canon plus screenplay, and `long` for settings ??treatments ??scripts ??screenplay. Unspecified stages remain disabled drafts. Scripts completes content and expression within construction; screenplay alone has a separate naturalness pass. An omitted outline stage follows settings. Complete work is the default scope; an explicitly commissioned first-part pilot selects its exact part.

Turn on the research and the production's own development contracts when the commission needs them:

```ts
export default createEvidenceConfig({
  location: import.meta.dirname,
  research: "evidence",
  development: {
    entities: "evidence",
    behaviors: "evidence",
    composition: "evidence",
  },
});
```

`research` holds each study in `docs/research/` (apart from its index) to the story research principles, answered in `docs/evidence/construction/files/research/` under an H1 naming the study. `development.entities` holds exported types, classes, functions and methods under `src/entities/` to `contracts/development/entities.md`. `development.behaviors` holds exported functions and methods under `src/laws/`, `src/interactions/` and `src/consequences/` to `contracts/development/behaviors.md`, and each cites the study it follows; every study must be cited. `development.composition` holds exported functions and methods under `src/composition/` to `contracts/development/composition.md`: scenes in `src/composition/scenes/` cite the screenplay scenes (H2) and beats (H3) they realize, and every one must be realized; films in `src/composition/films/` cite the screenplay file they deliver, and every screenplay file must become a film. Omitted stages stay disabled.

## Native checking

Run `pnpm evidence` to evaluate every enabled claim and reference. Native Evidence owns coverage, checklist completeness, relationship cardinality and current fingerprint reviews. Exit codes are 0 for a complete analysis without errors, 1 for graph violations, and 2 for invalid configuration or incomplete analysis. A passing graph does not grant creative or delivered-output acceptance, and an inactive population does not establish that work exists.

Use `pnpm evidence list` to find configured targets, `pnpm evidence inspect <target>` to inspect them, and `pnpm evidence graph` to export the graph. Native `--only <targets...>` checks named configured units and their descendants after complete analysis; `--shallow` omits descendants. Counts, diagnostics and status then describe that selected scope. Read the installed `@wrtnlabs/evidence` documentation for selectors, addresses, annotations, detached evidence and fingerprints.

## Extending the graph

Top-level `claims` replaces the engineering defaults; use `createEngineeringClaims()` when extending them. `narrative.claims` appends ordinary `IEvidenceClaim[]` without changing the baseline. Native claim/reference fields determine respondents and relationships.

The `@automovie/evidence` entry exports narrative selectors, graph factories and local contract helpers. Construction evidence uses detached carriers under `docs/evidence/construction/{files,units}`. Screenplay naturalness uses working text under `docs/naturalness`, preserving its frozen construction lineage under `docs/revision`. Existing review claims compare their actual authored H2s with native current fingerprints; independent reviewers own their judgments.

`stripNaturalnessComments` removes HTML comments while retaining other bytes. `verifyEvidenceMetadataRewrite` checks an explicitly owned metadata-only rewrite against protected authored bytes. Neither helper evaluates narrative approval.
