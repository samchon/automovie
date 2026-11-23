# src/geometry/IAutoMovieShotEffect.ts#IAutoMovieShotEffect

## @evidence contracts/development/design.md#principled-representation

start is inclusive and end exclusive in shot-local seconds; id and zone retain their compiled cue and world-zone identities.

## @evidence contracts/development/design.md#minimal-and-owned-surface

projectProductionShotEffectFilmIntervals reads this Pick of IAutoMovieCompiledEffect without requiring simulation recipes or emitter state.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Projection checks finite nonnegative start, end greater than start and representable frame boundaries; id and zone resolution remain compilation responsibilities.

## @evidence contracts/development/common.md#meaningful-documentation

The cue identity and shot-local time window needed for film interval projection. start is inclusive and end exclusive in shot-local seconds; id and zone retain their compiled cue and world-zone identities.
