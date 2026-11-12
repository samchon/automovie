---
name: project
description: Defines the automovie product contract, its decided exclusions, package boundaries, and commands the tree does not show. Use when judging whether a capability is in scope, choosing which package owns a change, or choosing a build, test, or evidence command.
---

# Project

## Product contract

AutoMovie produces film-generation diffusion hints from an LLM-authored screenplay: readable geometry, staging, motion and timing, reproducible frame to frame. A change that buys visual richness at the cost of determinism, authorability or review cost delivers the wrong thing.

### Coarse models, detailed motion

A production's person is the polygon man, drawn by `render` from the canonical body `human` prepares, and every other model is as simple as identification allows. Motion is authored in detail and must accurately realize the intended performance and interactions.

Develop on the coarse models with verified motion. Detail is an option of the same entity that a delivery switches on, such as a detailed Human surface a commission selects, so scene intent never depends on surface complexity.

### Representations

The production chooses its representations. Human parameters give every person a body; an important object may need only a coarse frame, and an object the hint does not need can remain a screenplay description.

Fixed 2D images, generated or imported 3D assets, and code-authored models are all available paths. Recover lofting curves when deformation, parameter control or internalization requires them, rather than imposing recovery on assets usable as supplied.

Installed package contracts define which paths are actually supported. Generated multiview images alone do not establish calibrated or recoverable geometry.

### Commissions

The scaffold owns direct LLM authoring of the screenplay. A short runs brief → screenplay, and long work, for a series or a very long film, runs settings → treatments → scripts → screenplay.

| Commission | Ends at |
| --- | --- |
| Screenplay only | The text |
| Film-generation hint | The main scenes' staging and motion programmed and the whole video assembled; supporting stills or isolated clips are insufficient |
| Finished video | The finished video, by direct 3D rendering or a chosen diffusion workflow |

Use the engine's supported physical computations and constraints to drive and verify the performance. Inspect the requested artifact and disclose unverified stages, because accurate conditioning does not guarantee an external generator's result.

A production records its adopted decisions in its generated project-root `PROJECT.md`, with execution and environment setup in its actual source and README.

### Authorable capability

A capability the authoring agent cannot drive is not a capability. Hence rough types in `interface`, closed unions instead of construction kits, and a formation as a count and a layout. `interface` and `engine` grow toward representing every object and motion, so each new axis is additive, never a rewrite.

Product packages and the shipped scaffold hold general capability, never finished content such as catalog entries, furniture, or profile libraries. Extend the engine when authoring is blocked, not to hand someone a finished chair; pre-built content also voids the subject-independence benchmark.

## Out of scope

Each decided exclusion is recorded in the JSDoc of the closest type with its reopening condition.

| Subject | In scope | Excluded |
| --- | --- | --- |
| Likeness and appearance | Numerically authored face, body, brow, surface hair and skin regions | Automatic likeness from photographs, strand physics, clothing beyond basic underwear, photographed skin texture |
| Ornate decoration | The general geometry to author it: non-convex profiles, sweeps, booleans, external models | Decoration as content |
| Cutaways | A section plane as an inspection control | A cutaway as a delivered frame or an authored camera field |
| Export and editing | Numerical face and body editing, static face GLTF/GLB export | Scene export and general 3D editing |
| Generated output | Fixed bytes with provenance | Nondeterministic completion |

## Packages

The [root README](../../../README.md#packages) and package READMEs own inventories. This table gives only the boundaries.

| Package | Owns |
| --- | --- |
| `interface` | The pure-type authoring AST |
| `engine` | Deterministic computation and runtime admission, and the universal motion primitives |
| `motions` | Human action content |
| `human` | The human figure generated from typed parameters by code |
| `recovery` | Reference-mesh reconstruction |
| `render` | Building and drawing scenes, the passes, the inspection core, the capture plan and record, frame schedules and encoding plans; launches nothing |
| `viewer` | The interactive display, a React library |
| `cli` | The `automovie` command: creating a production, and the hosts that capture, render and review it |
| `evidence` | Reusable engineering defaults and optional narrative evidence composition, for native checking |
| `template/scaffold` | The generated production instructions, editable contracts and thin configuration, which `cli` installs |

`render` and `viewer` are the only libraries whose public surface imports `three.js`; a package's subject module, kept out of its barrel, may import it to build what the shared instrument draws. The Human figure is inspected that way, through a subject module of `human`.

### Hosts

`render` reaches files, processes and the page only through what a host injects, and imports no `node:` module and no React, so one rule runs the same in a page, a Node host and a unit test against an in-memory host. A rule that does not depend on one production belongs in `render` with a logic unit test; a host holds wiring only. The page is `viewer`'s interactive display, and the Node host that drives FFmpeg and a headless browser is `cli`.

### Motion

`motions` owns every action law and what runs it; `engine` keeps only universal motion primitives with cited practice and no action vocabulary.

### Recovery

`recovery` owns its algorithms, policy, workflows, APIs and hosts. Its shared declarative input contracts stay in `interface`, existing reusable mathematics and surface generation stay in `engine`, and display stays in `viewer`. Recovery-specific algorithms do not move into `engine`.

### Productions

Productions live in the [automovie-examples](https://github.com/samchon/automovie-examples) repository, not here. A local clone sits at the ignored `examples/` as its own pnpm workspace with its own lockfile, linking this repository's packages by relative path, so this repository's workspace and lockfile never depend on whether it is present.

## Commands

- The workspace runs Node 22.23.2, and `human` and generated projects require at least that.
- `pnpm run build` compiles with correctness lint and the shared native declaration guards.
- `pnpm run evidence` separately checks checklist answers.
- CI runs build and evidence in `build.yml` and the suite in `test.yml`; `website.yml` also deploys on a `master` push.

The Node floor exists because older Node 22 loaders can expose an unevaluated ES module in a mixed CommonJS and ES-module graph.
