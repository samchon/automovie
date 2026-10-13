---
name: project
description: Defines the automovie product contract, its decided exclusions, package boundaries, and commands the tree does not show. Use when judging whether a capability is in scope, choosing which package owns a change, or choosing a build, test, or evidence command.
---

# Project

## Product Contract

The render is a prototype: readable geometry, staging, motion, and timing, reproducible frame to frame, which a diffusion lane may repaint. A change that buys visual richness at the cost of determinism, authorability, or review cost delivers the wrong thing.

A capability the authoring agent cannot drive is not a capability. Hence rough types in `interface`, closed unions instead of construction kits, a formation as a count and a layout, and figures in `archetypes` instead of `engine`. `interface` and `engine` grow toward representing every object and motion, so each new axis is additive, never a rewrite.

Product packages and the shipped scaffold hold general capability, never finished content such as catalogue entries, furniture, or profile libraries. Extend the engine when authoring is blocked, not to hand someone a finished chair; pre-built content also voids the subject-independence benchmark.

## Out of Scope

Decided exclusions, each recorded in the JSDoc of the closest type with its reopening condition:

- Likeness and detailed appearance: numerically authored face, body, brow, surface hair, and skin regions are in scope; automatic likeness from photographs, strand physics, clothing beyond basic underwear, and photographed skin texture are not.
- Ornate decoration as content; only the general geometry to author it (non-convex profiles, sweeps, booleans, external models).
- Cutaways as delivered frames: a section plane is an inspection control, never an authored camera field.
- Scene export and general 3D editing, except numerical face and body editing and static face GLTF/GLB export.
- Nondeterministic completion: generated output enters only as fixed bytes with provenance.

## Packages

The [root README](../../../README.md#packages) and package READMEs own inventories. Boundaries:

- `interface` is the pure-type authoring AST; `engine` owns deterministic computation and runtime admission.
- `viewer` is the only library importing `three.js` (GPU display, capture, inspection transport); `playground` mounts it and owns the Human inspection application and example parameter sets.
- `human` owns numerical human capability and basis assets.
- `production` orchestrates engine, evidence, and render with no network authoring surface; `mcp` only reads production Markdown.
- `archetypes` owns the shipped figure and prop catalogue; a customer's own content stays in its production.
- `template/scaffold` owns the generated harness; `cli` installs it; `evidence` builds a production's contract graph.
- The four productions under `experimental/` feed the public website and are not disposable.

## Commands

- The workspace runs Node 22.23.2; `human` and generated projects require at least that, because older Node 22 loaders can expose an unevaluated ES module in a mixed CommonJS and ES-module graph.
- `pnpm run build` compiles with correctness lint and the shared native declaration guards; `pnpm run evidence` separately checks checklist answers.
- CI runs build and evidence in `build.yml` and the suite in `test.yml`; `website.yml` also deploys on a `master` push.
