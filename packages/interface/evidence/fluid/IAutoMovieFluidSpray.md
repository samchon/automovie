# src/fluid/IAutoMovieFluidSpray.ts#IAutoMovieFluidSpray

## @evidence contracts/development/design.md#principled-representation `sampleFluidSpray` derives each particle's direction from `seededValue(seed, index, axis salt)` and its position from `p0 + d * speed * age - g * age² / 2 * y`, so a sample is a pure function of the emitter, the solved state and the camera distance.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Spray is an emitter description with no particle state, kept beside the conserved field on the domain but outside its mass balance, so the solver never reads it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The engine applies thinning and the hard cap before projection, rather than asking a renderer to select a population. Particles ignore geometry; jitter cancellation, an unrepresentable finite-axis norm, extreme spawn-index products and ballistic overflow have no separate result-admission gate, so finite authored fields alone do not prove a finite or visually faithful sample.

## @evidence contracts/development/common.md#meaningful-documentation

States the determinism, both bounds and their order, the launch time, the nozzle position and that it follows the sampled surface, the absent collisions, and the validation rules; members give units, ranges and how each value shapes the sample.
