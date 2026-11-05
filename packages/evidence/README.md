# @automovie/evidence

Compose native Evidence claims for engineering and optional narrative work. Each production owns its instructions, contracts, creative bodies, evidence and independent reviews.

## Configuration

Export one configuration from `evidence.config.ts`:

```ts
import { createEvidenceConfig } from "@automovie/evidence";

export default createEvidenceConfig({ location: import.meta.dirname });
```

The default selects exported source types, interfaces and classes under `src/**/*.ts` against `.agents/skills/contracts/development/design.md`, exported source functions and class methods against `contracts/development/implementation.md`, and exported test functions under `test/**/test_*.ts` against `contracts/development/testing.md`; every one of them also answers `contracts/development/common.md`. It selects no narrative. Location is the absolute project directory; native Evidence resolves selected inputs relative to the authored configuration.

A production whose checklists predate that layout keeps them by passing `claims: createEngineeringClaims({ common: null, design: "contracts/common.md", implementation: "contracts/common.md", tests: "contracts/testing.md" })`.

Add narrative when commissioned:

```ts
export default createEvidenceConfig({
  location: import.meta.dirname,
  narrative: {
    mode: "short-with-settings",
    construction: { settings: "evidence", screenplay: "evidence" },
    naturalness: { screenplay: "evidence" },
  },
});
```

Use `short` for direct screenplay, `short-with-settings` for compact canon plus screenplay, and `long` for settings → treatments → scripts → screenplay. Unspecified stages remain disabled drafts. Scripts completes content and expression within construction; screenplay alone has a separate naturalness pass. An omitted outline stage follows settings. Complete work is the default scope; an explicitly commissioned first-part pilot selects its exact part.

Turn on the performance research and the production's own development contracts when the commission needs them:

```ts
export default createEvidenceConfig({
  location: import.meta.dirname,
  research: "evidence",
  development: {
    assets: "evidence",
    motion: "evidence",
    shots: "evidence",
    films: "evidence",
  },
});
```

`research` holds each study in `docs/research/` (apart from its index) to the story research principles, answered in `docs/evidence/construction/files/research/` under an H1 naming the study. `development.motion` holds exported functions under `src/motion/` to `contracts/development/motion.md`, and each cites the study it follows; every study must be cited. `development.assets` holds exported functions under `src/assets/` to `contracts/development/assets.md`. `development.shots` holds exported functions under `src/shots/` to `contracts/development/shots.md`, and each cites the screenplay H2s it executes; every screenplay H2 must be executed. `development.films` holds exported functions under `src/films/` to `contracts/development/films.md`, and each cites the screenplay file it delivers; every screenplay file must become a film. Omitted stages stay disabled.

## Native checking

Run `pnpm evidence` to evaluate every enabled claim and reference. Native Evidence owns coverage, checklist completeness, relationship cardinality and current fingerprint reviews. Exit codes are 0 for a complete analysis without errors, 1 for graph violations, and 2 for invalid configuration or incomplete analysis. A passing graph does not grant creative or delivered-output acceptance, and an inactive population does not establish that work exists.

Use `pnpm evidence list` to find configured targets, `pnpm evidence inspect <target>` to inspect them, and `pnpm evidence graph` to export the graph. Native `--only <targets...>` checks named configured units and their descendants after complete analysis; `--shallow` omits descendants. Counts, diagnostics and status then describe that selected scope. Read the installed `@wrtnlabs/evidence` documentation for selectors, addresses, annotations, detached evidence and fingerprints.

## Extending the graph

Top-level `claims` replaces the engineering defaults; use `createEngineeringClaims()` when extending them. `narrative.claims` appends ordinary `IEvidenceClaim[]` without changing the baseline. Native claim/reference fields determine respondents and relationships.

The `@automovie/evidence/narrative` entry exports narrative selectors, graph factories and local contract helpers. Construction evidence uses detached carriers under `docs/evidence/construction/{files,units}`. Screenplay naturalness uses working text under `docs/naturalness`, preserving its frozen construction lineage under `docs/revision`. Existing review claims compare their actual authored H2s with native current fingerprints; independent reviewers own their judgments.

`stripNaturalnessComments` removes HTML comments while retaining other bytes. `verifyEvidenceMetadataRewrite` checks an explicitly owned metadata-only rewrite against protected authored bytes. Neither helper evaluates narrative approval.
