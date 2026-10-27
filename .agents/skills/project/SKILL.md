---
name: project
description: Defines the automovie product contract, its decided exclusions, package boundaries, and commands the tree does not show. Use when judging whether a capability is in scope, choosing which package owns a change, or choosing a build, test, or evidence command.
---

# Project

## Product Contract

AutoMovie produces film-generation diffusion hints from an LLM-authored screenplay: readable geometry, staging, motion and timing, reproducible frame to frame. Stick figures or coarse block-like meshes can be sufficient; the motion must accurately realize the intended performance and interactions. A change that buys visual richness at the cost of determinism, authorability or review cost delivers the wrong thing.

The production chooses its representations. Human is an optional way to express a person's identity; important objects may need only a coarse frame, and objects unnecessary to the hint can remain screenplay descriptions. Fixed 2D images, generated or imported 3D assets, and code-authored models are available paths. Recover lofting curves when deformation, parameter control or internalization requires them, rather than imposing recovery on assets usable as supplied. Installed package contracts define which paths are actually supported; generated multiview images alone do not establish calibrated or recoverable geometry.

The scaffold owns direct LLM authoring of settings → treatments → scripts → final audiovisual screenplay, with a direct screenplay route for short video. A film-generation hint commission programs the main scenes' staging and motion and assembles the whole video; supporting stills or isolated clips are insufficient. A screenplay-only commission ends at text. A requested finished video may use direct 3D rendering or a chosen diffusion workflow. Start with low-cost instances and verified motion, then expose selective detail upgrades without coupling scene intent to surface complexity. Use the engine's supported physical computations and constraints to drive and verify the performance. Record adopted production decisions in the generated project-root `PROJECT.md`, with execution and environment setup in the actual source and README. Inspect the requested artifact and disclose unverified stages; accurate conditioning does not guarantee an external generator's result.

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
- `recovery` owns reference-mesh reconstruction algorithms, policy, workflows, APIs and hosts. Its shared declarative input contracts stay in `interface`, existing reusable mathematics and surface generation stay in `engine`, and display stays in `viewer`; recovery-specific algorithms do not move into `engine`.
- `viewer` is the only library importing `three.js` (GPU display, capture, inspection transport); `playground` mounts it and owns example parameter sets. The parameter-only Human surface has no viewer or capture entry point.
- `human` owns the human figure generated from typed parameters by code.
- `archetypes` owns the shipped figure and prop catalogue; a customer's own content stays in its production.
- `evidence` owns reusable engineering defaults, optional narrative evidence composition, and pass checking. `template/scaffold` owns the generated production instructions, editable contracts, and thin configuration; `cli` installs them.
- The four productions under `experimental/` feed the public website and are not disposable.

## Commands

- The workspace runs Node 22.23.2; `human` and generated projects require at least that, because older Node 22 loaders can expose an unevaluated ES module in a mixed CommonJS and ES-module graph.
- `pnpm run build` compiles with correctness lint and the shared native declaration guards; `pnpm run evidence` separately checks checklist answers.
- CI runs build and evidence in `build.yml` and the suite in `test.yml`; `website.yml` also deploys on a `master` push.
