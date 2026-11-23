# src/actions/jumpPath.ts#jumpPath.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States the ends, the accelerations and why the start's is kept.

## @evidence contracts/development/implementation.md#principled-implementation

The engine's quintic Hermite rule over seconds, values, velocities and accelerations at both ends.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Copy the fixed endpoint jets once, then each local-time read uses one engine weight set and combination.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The share is clamped, so the path holds its ends outside its span.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed endpoint arrays/records prepare once per phase instead of being reallocated at each read; varying time still evaluates the original fixed-degree engine basis and ordered sum. Speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses AutoMovieStationHermite for every read and shares only the copied unchanged endpoint jets/duration within this phase's plan; no queried time or point is cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The phase reader owns two fixed endpoint records and six three-number arrays until the plan releases it; each read returns a fresh point and retains no history or handle.

# src/actions/jumpPath.ts#jumpPath.lerp

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the result.

## @evidence contracts/development/implementation.md#principled-implementation

Componentwise linear interpolation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One literal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The share is not clamped; callers pass shares of a path.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/actions/jumpPath.ts#jumpPath.unwrap

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the unit and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The difference wrapped to half a turn.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One wrap.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reuses the engine's wrap rather than a loop.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `wrapDegrees`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
