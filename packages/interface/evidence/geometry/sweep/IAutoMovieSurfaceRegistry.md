# src/geometry/sweep/IAutoMovieSurfaceRegistry.ts#IAutoMovieSurfaceRegistry

## @evidence contracts/development/design.md#principled-representation

Vertices welded by exact identity, each bound once to the evaluation that places it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One map from identity to index and one ordered list of writers, which runs in dependency order because a vertex is registered after everything it reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Nothing is welded by distance; `existing` refuses an identity no patch made.

## @evidence contracts/development/common.md#meaningful-documentation

States the identity rule, the writer order and the finalization of sweep points.

# src/geometry/sweep/IAutoMovieSurfaceRegistry.ts#IAutoMovieSurfaceRegistry.ISweep

## @evidence contracts/development/design.md#principled-representation

The same sweep writer and resolved cell used by the emitted shared sample.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A writer and four scalar reaches; callers bind them once during compilation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Carries geometric field data rather than a mutable target-buffer lookup.

## @evidence contracts/development/common.md#meaningful-documentation

States units, stage and finalization-only delivery.
