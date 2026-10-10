---
name: project
description: Defines the automovie product contract, what the product deliberately does not do, the long-haul mission, workspace layout, and canonical commands. Use when orienting in the repository, working inside any package, choosing a build, test or format command, or judging whether a proposed capability is in scope.
---

# Project Outline

## Product Contract

`automovie` moves and forms characters and objects through LLM function calling and structured output, then validates and renders them deterministically. It is the cheap, controllable, reproducible alternative to diffusion image and video generators: a fixed asset performed by an LLM and rendered by a deterministic engine gives the frame-to-frame consistency diffusion cannot.

**What comes out is a prototype.** The render is a blocking pass and no finished shot: readable geometry, correct staging, motion and timing, reproducible frame to frame. A director watches it to judge whether the film works, and a diffusion lane repaints it when a finished look is wanted. Photorealism is not the bar, so a change that buys visual richness at the cost of determinism, authorability or review cost delivers the wrong thing.

**A capability the authoring agent cannot drive is not a capability.** The ceiling is what an LLM can emit toward, not what a renderer could draw, because a surface nobody drives still costs documentation, tests and maintenance while producing nothing. That criterion settles every scope question below and explains the repository's shape: rough types in `interface`, closed unions instead of construction kits, a formation as a count and a layout instead of two thousand records, figures and gait tables in `archetypes` instead of `engine`.

The endgame is to represent all objects and all motion (rigs, range-of-motion constraints, joint dependencies and drivers, cameras, lights, scenes, time) well enough to assemble a film from objects and motion alone. The early function-calling schema may stay humble (a clothed character that walks, runs, dances), but `interface` and `engine` are built to the final goal and stay permanently extensible: every future axis (a rig profile, a finer detail layer, a camera, a prop, dynamics, a timeline) is additive, never a rewrite. A bare imported 3D model has no constraints or dependencies, and adding that semantic layer is what makes automovie an engine and not a model holder.

This is a long-haul mission. `interia`, the sibling interior-spaces project, shares automovie's philosophy and conventions and forms one set with it long-term.

## Out of Scope

These are decided exclusions, not backlog. Each carries the condition that reopens it and belongs in the contract JSDoc of the type that comes closest, the way `IAutoMovieEnvironmentInstant` states that sun direction is an input and `IAutoMovieCameraIntent` states that depth of field belongs to the repaint lane. An unwritten decision is rediscovered as a gap every few months.

- **Detailed appearance.** The [product scope](../../../docs/requirements/product/scope-and-exclusions.md#product-detailed-likeness-exclusion) owns the boundary, including its numerical face, brow and surface-based hair exception. Read the 3D modeling skill before changing or judging geometry. A constructed face is not an accepted likeness.
- **Ornate decoration.** Mouldings, cornices, carved ornament and decorative catalogues are content. The repository may owe the general geometry a customer needs to author one: non-convex profiles, sweeps, booleans and an external-model escape hatch.
- **Cutaways as delivered frames.** A section plane that removes a roof or wall so a floor can be read is an inspection control and never a field of an authored camera. Nothing fills the exposed cut.
  - A frame taken after a wall was removed is a diagram about the production and not evidence about the delivered image. Admitting the plane into the delivery camera would also make acceptance depend on it, since a required subject sliced in half could no longer count as read, and would force `outline`, `mask` and `depth` to agree on one section.
  - The capability ships for review as `IAutoMovieSectionPlane`, `classifyAutoMovieSectionPlaneBox` in `engine` and `applyAutoMovieSectionPlanes` in `viewer`.
  - It reopens when a production must deliver a cutaway as a shot. Then the plane becomes an authored camera field, `realizeShotContract` counts a clipped-away subject as unreadable, and capping becomes real work, because a hollow shell in a delivered frame is a defect.
- **Scene export.** The [editor and export boundary](../../../docs/requirements/product/scope-and-exclusions.md#product-editor-export-exclusion) excludes generic scene export. Its static facial-asset exception does not export a film's scenes, rig animation or timeline.

## Capability and content

The product packages hold general capability. Named catalogue entries, furniture models, profile libraries and helpers that hand over finished content do not belong in `interface`, `engine`, `viewer`, `production` or the shipped scaffold. A customer agent authors its own assets in its own repository TypeScript. Extending the engine or renderer is justified when authoring an object is blocked or crippled (a missing geometric operation, a lost degree of freedom, a relationship nothing can express), not by the wish to hand someone a finished chair. The urge to pre-build usually signals that authoring is too hard right now, and shipping the catalogue hides that gap instead of closing it.

Pre-built content also destroys a measurement: the subject-independence benchmark asks whether an agent can build a film from a subject the repository planted nothing for, so anything planted for a subject removes what it measures.

A logic example belongs in a pure unit test, a shipped archetype in `packages/archetypes`, and a temporary production in its own disposable sandbox. The [scaffold skill](../scaffold/SKILL.md#verification) owns generated-consumer verification. None belongs in `engine`, `interface` or the scaffold every generated project inherits verbatim.

## Layout

The [root package map](../../../README.md#packages) and each package README own API inventories. Preserve these boundaries when choosing an owner:

- `interface` is the pure-type authoring AST; `engine` owns deterministic computation and runtime admission. The [engine README](../../../packages/engine/README.md#constrained-surface-displacement) owns its pinned numerical WebAssembly kernel and rebuilding boundary.
- `viewer` is the only library package importing `three.js`; `playground` mounts it. `production` orchestrates the engine, evidence and render libraries without a network authoring surface. `mcp` provides read-only Markdown navigation and never authors, executes or judges evidence.
- `human` owns numerical human capability and participates in implementation contracts outside the repository triangle. Read [human.md](human.md) for Human development and 30-minute supervision. Its [README](../../../packages/human/README.md) owns supported use. Named people and photograph-derived documents belong in test studies.
- `archetypes` owns the shipped figure/prop catalogue behind the registry the builder is handed. Customer-authored content stays in its own production.
- `template/scaffold` owns the generated authoring harness under the [scaffold skill](../scaffold/SKILL.md); `cli` and `create-automovie` install it. `evidence` turns a production's typed declaration into its separate contract graph.
- `docs` owns repository requirements/specifications; `config` owns shared TypeScript/lint policy; `test` owns the pure-unit suite under the [development skill](../development/SKILL.md#testing).
- The four retained architectural productions under `experimental/` feed the public website and are not disposable sandboxes. The [website README](../../../website/README.md) owns that handoff and deployment.
- `.wiki/` is ignored working knowledge under the [documentation skill](../documentation/wiki.md); `.references/` holds ignored downloaded research materials.

## Commands

The [root README](../../../README.md#repository-development) lists the install, build and test entry points, and each package README owns its own scripts. Facts the tree does not show:

- `pnpm run build` compiles packages with ordinary correctness lint. `pnpm run evidence` independently checks the repository graph with `@wrtnlabs/evidence`, followed by the existing native documentation, singular-identity, and todo guards. Contract or citation defects fail the evidence gate.
- The [development skill](../development/SKILL.md#testing) owns the test commands, and `pnpm run format` runs once before merge under the [pull-request skill](../pull-request/SKILL.md).
- The workspace runs Node 22.23.2 (`useNodeVersion` in `pnpm-workspace.yaml`), and `human` and generated projects declare Node 22.23.2 or later because older Node 22 loaders can expose an unevaluated ES-module dependency in a mixed CommonJS and ES-module import graph.
- `.github/workflows/{build,test,website}.yml` own the CI commands; `build.yml` runs the separate build and evidence commands in order, and `website.yml` also deploys `website/dist` on a `master` push.
