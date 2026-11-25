---
name: project
description: Defines the automovie product contract, package boundaries and commands.
---

# Project

## Product contract

AutoMovie produces reproducible geometry, staging, motion and timing from an LLM-authored screenplay for film diffusion. Preserve determinism, authorability and reviewability when adding visual detail.

### Coarse models, detailed motion

The `render` package draws the polygon man from the canonical body `human` prepares. Author motion that realizes the intended performance and interactions.

Develop and verify motion on coarse models. Enable detail on the same entity for delivery when commissioned.

### Representations

By default a person is the polygon man, an object comes from `archetypes`, and anything else is a coarse form. An object the hint does not need stays a screenplay description.

Use supported, commissioned 2D images, external meshes or crafted forms. Recover curves only for deformation, parametric control or internalization. Require independent evidence of calibration and recoverability before recovering from generated views.

### Commissions

The scaffold owns the [screenplay routes](../../../packages/template/scaffold/instructions/.agents/skills/story/workflow/routes.md). Its narrative passes run brief → screenplay for a short and settings → treatments → scripts → screenplay for long work.

| Commission | Ends at |
| --- | --- |
| Screenplay only | The text |
| Film-generation hint | The whole video assembled from the required scenes' programmed staging and motion |
| Standalone asset | The asset verified in its commissioned use |
| Finished video | The finished video, by direct 3D rendering or a chosen diffusion workflow |

Supporting stills or isolated clips do not complete a film-generation hint.

A production's performance is kinematic, authored and verified against the engine's supported constraints. Simulation serves only a response the screenplay decides and the kinematic performance cannot show.

Inspect the commissioned artifact and report unverified stages.

A production records its adopted decisions in its own `PROJECT.md` and its creative instructions in `docs/instructions`.

### Authorable capability

Put authorable types in `interface`. Use closed unions and parameters. Extend `interface` and `engine` with additive axes for new objects and motions.

Product packages and the scaffold provide general capability. Extend the engine when it cannot express commissioned work. Keep finished content in productions to preserve the subject-independence benchmark.

## Out of scope

Each decided exclusion is recorded in the JSDoc of the closest type with its reopening condition.

### Likeness and appearance

Procedural Human covers numerically authored face, body, brow, surface hair, skin regions and basic underwear. Its exclusions include automatic likeness from photographs, strand physics, other wardrobe and photographed skin texture. A production can commission detail through supported external or crafted assets.

### Ornate decoration

The general geometry to author ornate decoration is in scope: non-convex profiles, sweeps, booleans and external models. Decoration as content is excluded.

### Cutaways

A section plane as an inspection control is in scope. A cutaway as a delivered frame or an authored camera field is excluded.

### Export and editing

Numerical face and body editing and static face GLTF/GLB export are in scope. Scene export and general 3D editing are excluded.

### Generated output

Fixed bytes with provenance are in scope. Nondeterministic completion is excluded.

## Packages

Inventories are in the [root README](../../../README.md#packages) and the package READMEs.

| Package | Owns |
| --- | --- |
| `interface` | Canonical common and domain contracts, including the authoring AST |
| `engine` | Deterministic computation and runtime admission, and the universal motion primitives |
| `motions` | Human action content |
| `human` | The human figure generated from typed parameters by code |
| `archetypes` | Coarse seeded producers of what a person acts with, and their affordances |
| `recovery` | Reference-mesh reconstruction |
| `ingest` | Deterministic decoding and inspection of external media bytes |
| `render` | Building and drawing scenes, the passes, the inspection core, the capture plan and record |
| `viewer` | The interactive display, a React library |
| `cli` | The `automovie` command: creating a production, and the hosts that capture, render and review it |
| `evidence` | Reusable engineering defaults and optional narrative evidence composition, for native checking |
| `template/scaffold` | The generated production instructions, editable contracts and thin configuration |

`archetypes` covers objects, furniture, architecture, vehicles, animals and weapons, and no product package depends on it. `render` also owns frame schedules and encoding plans, and launches nothing. `cli` installs `template/scaffold`.

`interface` owns the pure contracts exposed by `engine`, `human`, `motions`, `recovery`, `ingest` and `render`, including inputs, results and callbacks. Keep runtime code, frontend contracts and types with implementation dependencies in their owning packages. Reuse common model, affordance, body, rig and geometry types for new assets.

Only `render` and `viewer` import `three.js` in their public surface. A package's subject module, kept out of its barrel, may import it to build what the shared instrument draws, which is how the Human figure is inspected.

### Hosts

Inject files, processes and pages into `render` through hosts. Keep `node:` and React imports out. Test reusable behavior with an in-memory host. `viewer` owns display and `cli` owns FFmpeg and browser capture.

### Motion

`motions` owns every action law and what runs it; `engine` keeps only universal motion primitives with cited practice and no action vocabulary.

### Recovery

Keep recovery algorithms, policy, workflows and hosts in `recovery`. Keep its pure contracts in `interface`, shared math and surface generation in `engine`, and display in `viewer`.

### Productions

Productions live in [automovie-examples](https://github.com/samchon/automovie-examples). Its optional local checkout, `examples/`, keeps an independent pnpm workspace and lockfile and links this repository's packages by relative path.

## Commands

- The workspace runs Node 22.23.2, and `human` and generated projects require at least that.
- `pnpm run build` compiles with correctness lint and the shared native declaration guards.
- `pnpm run evidence` separately checks checklist answers.
- CI runs the build in `build.yml` and the suite in `test.yml`; `website.yml` also deploys on a `master` push.

The Node floor exists because older Node 22 loaders can expose an unevaluated ES module in a mixed CommonJS and ES-module graph.
