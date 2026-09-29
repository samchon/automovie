---
name: project
description: Defines the automovie product contract, what the product deliberately does not do, the long-haul mission, workspace layout, and canonical commands. Use when orienting in the repository, working inside any package, choosing a build, test, format, or coverage command, or judging whether a proposed capability is in scope.
---

# Project Outline

## Product Contract

`automovie` moves and forms characters and objects through LLM function calling and structured output, then validates and renders them deterministically. It is the cheap, controllable, reproducible alternative to diffusion image and video generators: a fixed asset performed by an LLM and rendered by a deterministic engine gives the frame-to-frame consistency diffusion cannot.

**What comes out is a prototype, not a finished shot.** The render is a blocking pass with readable geometry, correct staging, motion and timing, reproducible frame to frame. A director watches it to judge whether the film works, and a diffusion lane repaints it when a finished look is wanted. Photorealism is not the bar, so a change that buys visual richness at the cost of determinism, authorability or review cost delivers the wrong thing.

**A capability the authoring agent cannot drive is not a capability.** The ceiling is what an LLM can emit toward, not what a renderer could draw, because a surface nobody drives still costs documentation, tests and maintenance while producing nothing. That criterion settles every scope question below and explains the repository's shape: rough types in `interface`, closed unions instead of construction kits, a formation as a count and a layout instead of two thousand records, figures and gait tables in `archetypes` instead of `engine`.

The endgame is to represent all objects and all motion (rigs, range-of-motion constraints, joint dependencies and drivers, cameras, lights, scenes, time) well enough to assemble a film from objects and motion alone. The early function-calling schema may stay humble (a clothed character that walks, runs, dances), but `interface` and `engine` are built to the final goal and stay permanently extensible: every future axis (a rig profile, a finer detail layer, a camera, a prop, dynamics, a timeline) is additive, never a rewrite. A bare imported 3D model has no constraints or dependencies, and adding that semantic layer is what makes automovie an engine and not a model holder.

This is a long-haul mission. `interia`, the sibling interior-spaces project, shares automovie's philosophy and conventions and forms one set with it long-term.

## Out of Scope

These are decided exclusions, not backlog. Each carries the condition that reopens it and belongs in the contract JSDoc of the type that comes closest, the way `IAutoMovieEnvironmentInstant` states that sun direction is an input and `IAutoMovieCameraIntent` states that depth of field belongs to the repaint lane. An unwritten decision is rediscovered as a gap every few months.

- **Detailed appearance.** The [product scope](../../../docs/requirements/product/scope-and-exclusions.md#product-detailed-likeness-exclusion) owns the boundary, including its numerical face, brow and surface-based hair exception. Read the 3D modeling skill before changing or judging geometry. A constructed face is not an accepted likeness.
- **Ornate decoration.** Mouldings, cornices, carved ornament and decorative catalogues are content. The repository may owe the general geometry a customer needs to author one: non-convex profiles, sweeps, booleans and an external-model escape hatch.
- **Cutaways as delivered frames.** A section plane that removes a roof or wall so a floor can be read is an inspection control and never a field of an authored camera; nothing fills the exposed cut. A frame taken after a wall was removed is a diagram about the production and not evidence about the delivered image, and admitting the plane into the delivery camera would make acceptance depend on it (a required subject sliced in half could no longer count as read) and force `outline`, `mask` and `depth` to agree on one section. The capability ships for review (`IAutoMovieSectionPlane`, `classifyAutoMovieSectionPlaneBox` in `engine`, `applyAutoMovieSectionPlanes` in `viewer`). It reopens when a production must deliver a cutaway as a shot; then the plane becomes an authored camera field, `realizeShotContract` counts a clipped-away subject as unreadable, and capping becomes real work because a hollow shell in a delivered frame is a defect.
- **Scene export.** The [editor and export boundary](../../../docs/requirements/product/scope-and-exclusions.md#product-editor-export-exclusion) excludes generic scene export. Its static facial-asset exception does not export a film's scenes, rig animation or timeline.

## Capability, Not Content

The product packages hold general capability. Named catalogue entries, furniture models, profile libraries and helpers that hand over finished content do not belong in `interface`, `engine`, `viewer`, `production` or the shipped scaffold. A customer agent authors its own assets in its own repository TypeScript. Extending the engine or renderer is justified when authoring an object is blocked or crippled (a missing geometric operation, a lost degree of freedom, a relationship nothing can express), not by the wish to hand someone a finished chair. The urge to pre-build usually signals that authoring is too hard right now, and shipping the catalogue hides that gap instead of closing it.

Pre-built content also destroys a measurement: the subject-independence benchmark asks whether an agent can build a film from a subject the repository planted nothing for, so anything planted for a subject removes what it measures.

A logic example belongs in a pure unit test, a shipped archetype in `packages/archetypes`, and a production authored for an experiment in its disposable sandbox under the [experiment skill](../experiment/SKILL.md). None belongs in `engine`, `interface` or the scaffold every generated project inherits verbatim.

## Layout

- `packages/interface` (`@automovie/interface`): the type hub and AST the LLM emits against (geometry, skeleton and rig, pose, expression, motion, material, model, scene, validation). Pure types with no runtime dependency, under the development skill's rough-types rule.
- `packages/engine` (`@automovie/engine`): the deterministic engine: math, forward kinematics, range-of-motion and other constraint validators, motion sampling, tessellation, and the film pipeline (stage, block, perform, cut). TypeScript with a pinned synchronous numerical WebAssembly kernel for constrained displacement, and no `three.js`. The [engine README](../../../packages/engine/README.md#constrained-surface-displacement) owns that runtime and its rebuilding boundary.
- `packages/evidence` (`@automovie/evidence`): the reusable production-authoring evidence graph. It validates film, brief and library topology and turns one generated project's stages plus additive claims into `@ttsc/evidence` configuration. One typed `lint.config.ts` owns that project-local declaration, and every reusable target lives in the generated project's scaffold-local `docs` inventory.
- `packages/human` (`@automovie/human`): numerical facial anatomy, identity and expression documents, component replacement, editor state and static face export. Named people and photograph-derived documents belong in test studies, never in this capability package. Its [README](../../../packages/human/README.md) owns package use. Read [human.md](human.md) before changing or investigating it: it owns the types-first rule, the package's contracts (it cites no requirement or specification page) and the face investigation procedure.
- `packages/archetypes` (`@automovie/archetypes`): the shipped model-archetype catalogue (parameter schemas, bounds, geometry builders, declarative gait tables) behind one registry the builder is handed and does not enumerate. A figure or prop the engine happens to ship lives here, so what a production performs stays the production's decision.
- `packages/ingest` (`@automovie/ingest`): glTF and model ingestion through `@gltf-transform/core`.
- `packages/viewer` (`@automovie/viewer`): the render and playback surface over `three.js`, the only library package that imports `three`. A viewer, not an editor. `playground` imports it as the demo application that mounts the viewer.
- `packages/render` (`@automovie/render`): the deterministic frame schedule and encode plan a render spec turns into, plus headless capture, guide passes, caption planning and sidecars, and chunked sequence rendering.
- `packages/cli` (`automovie`): the binary that scaffolds and inspects a production repository. `packages/template/scaffold/` is the blank authoring harness it stamps out (see the scaffold skill).
- `packages/create-automovie`: the one-command project creator, a thin front door onto the same scaffolder.
- `packages/playground`: Vite demo pages exercising the pipeline end to end, capture-verified through headless Chrome (see the viewer-verification skill).
- `packages/mcp` (`@automovie/mcp`): four read-only authored Markdown reference operations over the same providers as the local JSON command. It reads indices and annotation-free source projections and does not edit, compile, render, run commands or validate evidence.
- `packages/production` (`@automovie/production`): the deterministic production library a generated project runs on: the builder, the tracked project store, capture, inspection and the render job. It answers a project's own scripts and offers no network surface. The repository hosts no internal LLM or production-action tool server, and authoring doctrine stays in the shipped skills, separate from the optional Markdown reference navigation.
- `test/` (`@automovie/test`): the `@nestia/e2e` `DynamicExecutor` program. The development skill's Testing section owns its rules.
- `experimental/{ancient-civic-temple,medieval-baron-manor,modern-suburban-house,future-citizen-house}`: four retained architectural productions consumed by the public website's interactive 3D tours. The [website README](../../../website/README.md) owns their source and asset handoff. Disposable sandboxes follow the [experiment skill](../experiment/SKILL.md).
- `website/` (`@automovie/website`): the Vite static site published to GitHub Pages at `https://samchon.github.io/automovie/` by `.github/workflows/website.yml`. The [website README](../../../website/README.md) owns its collection, tours, galleries and commands.
- `config/` (`@automovie/config`): the workspace-wide base `tsconfig.json` and shared lint policy.
- `docs/` (`@automovie/docs`): product requirements and package-independent system specifications, checked as an evidence graph during the workspace build.
- `.wiki/` (gitignored): the working knowledge base, owned by the documentation skill.
- `.references/` (gitignored): downloaded reference materials (specifications, example models, motion datasets) for reference study.

## Commands

```bash
pnpm install                              # workspace install (native TypeScript 7 / tsgo via ttsc)
pnpm run build                            # docs evidence lint plus recursive package builds
pnpm run format                           # prettier write
pnpm --filter @automovie/test start       # run the test suite (ttsx, no separate compile step)
pnpm --filter @automovie/website build    # type-check and bundle the public site into website/dist
```

Node 22 LTS, pnpm 10. CI: `.github/workflows/{build,test,website}.yml`; `website.yml` also deploys `website/dist` to the `gh-pages` branch on a `master` push.
