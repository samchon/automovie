# src/fluid/IAutoMovieFluidSpraySample.ts#IAutoMovieFluidSpraySample

## @evidence contracts/development/design.md#principled-representation `sampleFluidSpray` copies `step` and `time` from the `IAutoMovieFluidState` it is given and walks each emitter's live spawn indices newest-first, so the sample and the surface of one frame always describe the same instant.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One flat particle list ordered by emitter and spawn index serves the viewer's single point cloud, with the emitter id on each particle instead of a nested per-emitter structure.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The clock is never re-derived from a shot second here, and the refusals for a foreign state or a non-finite distance replace what would otherwise be an empty or misplaced sample.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer, whose clock the sample uses, and both refusals; members give the step and time meaning and the particle order, bounds and empty case.
