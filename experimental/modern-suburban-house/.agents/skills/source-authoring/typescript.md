# TypeScript Authoring Handbook

AutoMovie source is ordinary tracked TypeScript compiled by `ttsc` and executed by `ttsx` in Node. Types and JSDoc are the primary payload textbook. Let the builder reject invalid structure early; do not defeat it with casts, `any`, ignored diagnostics, or copied generated JSON.

## Module shape

Use `defineShot(id, { scene, contract, build })` as the named export selected by the design record. Import runtime APIs directly from their packages and types with `import type`. Keep shot and film build functions reproducible from their explicit input and seed. Perform file and network acquisition in the project scripts that prepare those inputs.

This illustrative helper shows a type-only import and a named export:

```ts
import type { IAutoMovieShotSource } from "@automovie/interface";

export const registeredShotId = (source: IAutoMovieShotSource): string =>
  source.id;
```

Author a complete implementation when its source branch becomes active. [Ownership](../../../README.md) governs the source boundary; no placeholder implementation is supplied to fill in.

Prefer small deterministic functions named for domain decisions: frame conversion, camera placement, event construction, motion selection, formation state, or EDL interval. Validate meaning through engine contracts rather than duplicating math and accepting divergent behavior.

Keep every authored source file within 500 physical lines, including comments and blank lines. This includes source files containing only declarations or authored data. Split by cohesive responsibility with explicit inputs and outputs and one owner for each formula, boundary and mutable state transition. Keep orchestration readable; compression, removal of necessary explanation and forwarding chains do not satisfy the limit.

Each source file explains its responsibility, real entry points and consumers, inputs and outputs, ownership and mutation, processing order and why that order matters. For declaration or data owners, explain their role, provenance, interpretation and consumers; execution details apply where execution exists. Document applicable units, frames, signs, formula assumptions, degeneracies and non-obvious derivations beside their owner. Separate caller preconditions, established invariants and unresolved limits, and state which downstream results become stale when a shared result changes. Keep shared contracts at their canonical owner and link to them from callers.

These rules govern any module you write. How a production's source is arranged once its shots repeat is a separate decision with its own document: read [Composition](composition.md).

## Package APIs

Use the installed package exports through ordinary TypeScript imports. Node and `ttsx` own module loading; AutoMovie does not maintain a second import whitelist. The following examples route common authoring questions to their owners. Consult the package API for other exports.

Browser code runs without Node built-ins. Take its calculations from the public browser-compatible engine, viewer, interface, and render entry points after adding any dependency the requested work needs. Node-only production or render modules cannot enter a browser runtime import graph through a helper. A type-only import is erased and stays safe. [Live viewing](../review-verification/live-viewing.md) owns how to author a view when the work requires one.

For another capability, inspect the relevant package exports and their documented inputs before implementing a helper.

The capability list is navigation, not a geometry recipe. Before using an operation named above, follow [Geometry](geometry.md) to establish its result contract and account for topology, attributes, stable ranges, and bounds. If public exports and this route disagree, stop and repair both surfaces together rather than guessing from an internal symbol.

## Ownership

Pass typed production results directly to pure engine queries. Use the same source producer and explicit inputs as the viewer and delivery consumer, and record the revision and invocation basis of the measurement. [Compilation](compilation.md) owns execution; [Offline measurements](../review-verification/measurements.md) owns interpretation of query results.

## Numeric discipline

Use production frame rate and conversion helpers for time/frame boundaries. Keep units explicit in names and types: seconds, frames, meters, degrees, sample frames. Normalize angles and vectors through engine utilities. Avoid equality tests on derived floating-point values unless the function contract guarantees exact arithmetic; use a declared tolerance tied to the domain.

## Error paths

Let typed APIs return or throw their documented diagnostic form. At an authored boundary, add target id, source path, event id, time, expected range, observed value, and correction direction. A swallowed error becomes an expensive visual mystery.

## Review before commit

Trace every changed design/source join and downstream consumer. Check deterministic purity, source binding, stable ids, event time, final state, acceptance coverage, and generated ownership. Run the project's declared lint, format the code, and follow [Recording authored work](../review-verification/recording-work.md) for the commit boundary. Report the execution and observation that actually ran; no later campaign or CI is supplied by the scaffold.
