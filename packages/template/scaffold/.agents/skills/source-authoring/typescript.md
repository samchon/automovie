# TypeScript Authoring Handbook

AutoMovie source is ordinary tracked TypeScript compiled by `ttsc` and executed by `ttsx` in Node. Types and JSDoc are the primary payload textbook. Let the builder reject invalid structure early; do not defeat it with casts, `any`, ignored diagnostics, or copied generated JSON.

## Evidence carried by each export

Every TypeScript owner exposed through a public export and selected by an active source population answers both H2 checklists in `principles/core/source-units.md` in its own JSDoc. A top-level exported type, property, or function is one owner; each selected public member of an exported type is another. Read the declaration, initializer or body, source-local callees, graph claim, target, callers, tests, and generated consequence together. State how that owner preserves the exact scope it claims and constitutes a complete type, value, or behavior at its declared granularity. Review every evidence statement through [Semantic evidence inspection](../review-verification/semantic-review.md); semantic truth is a procedure, not a third self-citation.

Source-family obligations are different. They allocate the map, model, space, material, instance, motion, system, shot, production, or film roles one or more times across the selected source-owner population; one strong owner cannot answer a source-unit principle for a weak sibling. Do not cite `obligations/core/common.md#proportionate-development` from source: code length, export count, and file size do not prove completeness or a sound allocation of implementation effort.

Do not add a principle acknowledgement to silence a diagnostic. When an export omits or exceeds cited scope, is a placeholder or partial implementation, or gives a generic, copied, bundled, or false evidence reason, repair the earliest actual owner and every downstream consequence first. Renew a review only after rereading the complete behavior against the changed target.

Keep every public source declaration addressable by the evidence graph's `type`, `function`, or `property` selector. Export a named interface, type alias, class, function, or variable from the module that declares it, either directly or through a local named export. Do not export an enum, namespace, barrel or cross-module re-export, default alias or expression, anonymous default declaration, public getter, setter, auto-accessor, computed public member, or empty or whitespace-containing literal public name. Use a closed string-literal union instead of an enum, direct or local named ES-module exports instead of a namespace or cross-module re-export, a plain readonly property or named method instead of an accessor, and a stable non-empty identifier instead of a computed or whitespace-containing public name.

## Module shape

Use `defineShot(id, { scene, contract, build })` as the named export selected by a shot design record. Import runtime APIs directly from their packages and types with `import type`; [Compilation](compilation.md) owns pure execution and input acquisition.

Author a complete implementation when its source branch becomes active. [Ownership](../../../README.md#ownership) governs the source boundary; no placeholder implementation is supplied to fill in.

Prefer small deterministic functions named for domain decisions: frame conversion, camera placement, event construction, motion selection, formation state, or EDL interval. Validate meaning through engine contracts rather than duplicating math and accepting divergent behavior.

Keep every authored source file within 500 physical lines, including comments and blank lines. This includes source files containing only declarations or authored data. Split by cohesive responsibility with explicit inputs and outputs and one owner for each formula, boundary and mutable state transition. Keep orchestration readable; compression, removal of necessary explanation and forwarding chains do not satisfy the limit.

Each source file explains its own responsibility at the owning declaration, using only the facts that responsibility needs: input meaning and ownership, mutation, failure effects and a non-obvious processing order; units, frames, signs, degeneracies and the derivation or provenance of a non-obvious value; caller preconditions, established invariants and unresolved limits, kept separate; and the downstream results that become stale when a shared result changes. Do not restate every dependency's internals or a complete input, output and consumer inventory for a simple transport; keep shared contracts at their canonical owner and link to them from callers.

These rules govern any module you write. How a production's source is arranged once its shots repeat is a separate decision with its own document: read [Composition](composition.md).

## Package APIs

Use the installed package exports through ordinary TypeScript imports. Node and `ttsx` own module loading; AutoMovie does not maintain a second import whitelist. Read public JSDoc for the installed capability and supported inputs.

Browser code runs without Node built-ins. Take its calculations from the public browser-compatible engine, viewer, interface, and render entry points after adding any dependency the requested work needs. Node-only production or render modules cannot enter a browser runtime import graph through a helper. A type-only import is erased and stays safe. [Live viewing](../review-verification/live-viewing.md) owns how to author a view when the work requires one.

Use `npx --no-install automovie routes <film|brief|library>` for the installed capability owner/input/consumer matrix, then read the selected public export and JSDoc. The following boundary cases guide selection:

- Use whole-placement bounds for occupied extent and part bounds for separated geometry. A whole box can span empty space and cannot settle contact with one drawn part.
- Regenerate a formation or instance member from the current producer's compiled record, which carries terrain, prototype and resolved population data. A design record alone cannot supply that state.
- Pass the current typed design, compiled shot or film to `measureAutoMovieGeometry`; [Offline measurements](../review-verification/measurements.md#geometry-questions) owns interpretation.
- Resolve articulation ids through `placementChildNode` and building panel ids through `builtOpeningPanelPlacements`; display names are not scene-node identities.
- Viewer film sampling and effect verification use the public browser-compatible engine exports and the current compiled edit. Keep Node-only builders outside the runtime import graph.

For another capability, inspect the relevant package exports and their documented inputs before implementing a helper.

Before using a geometry operation, follow [Geometry](geometry.md) to establish its result contract and account for topology, attributes, stable ranges, and bounds. If public exports and this route disagree, stop and repair both surfaces together rather than guessing from an internal symbol.

## Numeric discipline

Use production frame rate and conversion helpers for time/frame boundaries. Keep units explicit in names and types: seconds, frames, meters, degrees, sample frames. Normalize angles and vectors through engine utilities. Avoid equality tests on derived floating-point values unless the function contract guarantees exact arithmetic; use a declared tolerance tied to the domain.

## Error paths

Let typed APIs return or throw their documented diagnostic form. At an authored boundary, add target id, source path, event id, time, expected range, observed value, and correction direction. A swallowed error becomes an expensive visual mystery.

## Review before commit

Trace every changed design/source join and downstream consumer. Check deterministic purity, source binding, stable ids, event time, final state, acceptance coverage, and generated ownership. Run the project's declared lint, format the code, and follow [Recording authored work](../review-verification/recording-work.md) for the commit boundary. Report the execution and observation that actually ran; no later campaign or CI is supplied by the scaffold.
