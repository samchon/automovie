# src/harness/IAutoMovieBeatEndFootPlant.ts#IAutoMovieBeatEndFootPlant

## @evidence contracts/development/design.md#principled-representation `pinStanceTargets` groups sampled contacts into maximal inclusive runs, takes a new run's first foot XZ and ground Y or the carried opening target, and shares that target across the run's sampled IK solves. `plantPerformShotStanceFeet` converts targets between model and world frames; the record describes the solve target, not measured achieved contact.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four fields, foot, run bounds and pinned point, are what the next beat's planting needs; the engine's internal plant output is mirrored here so the beat-end record stays in `interface` without importing engine types.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A carried target is preserved through frame conversion only for actual opening stance; it does not invent stance for a lifted foot or guarantee a constrained chain reaches its target. Missing recognized feet produce no plants, and nonfinite new or carried target coordinates throw in the planting pass.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer and when it produces plants, the world-space conversion, how the next beat consumes them and why; members give the clock, inclusivity, unit and frame of each field.
