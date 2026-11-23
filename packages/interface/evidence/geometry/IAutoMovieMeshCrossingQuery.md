# src/geometry/IAutoMovieMeshCrossingQuery.ts#IAutoMovieMeshCrossingQuery

## @evidence contracts/development/design.md#principled-representation

Both operations share the producer's exact edge-through-triangle and coplanar-overlap predicates over the same target snapshot; their boolean differs only by termination after a true witness.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A callable census and boolean share one target snapshot; withPositions explicitly produces another immutable snapshot using the same fixed layout instead of introducing a transform cache or second narrow phase.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Original ordinal identity and strict contact rules remain intact; no proxy, actor exclusion or cached answer replaces actual triangle tests, and a clear surface census does not infer inside/outside.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer, common metre frame, original ordinal/order, independent fixed-layout snapshots and the distinction between crossing evidence, an existential answer and absent volume/continuous proof.
