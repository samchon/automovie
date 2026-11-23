# src/index.ts#IAutoMovieFormationCycleTake

## @evidence contracts/development/design.md#principled-representation

Stores a Float32 affine rest-to-posed table with the homogeneous row implied; stride is estimated from the lowest baked part's path and contact-height fraction, while period comes from the declared gait. The contact heuristic is not exact for arbitrary gaits.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Timing quantities accompany their baked matrix table so formationCycleCadence and the shader select the same take instead of matching independent gait metadata.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A zero estimated stride selects time-period playback because no ground travel can drive that take; this is a movement distinction rather than a special idle asset name.

## @evidence contracts/development/common.md#meaningful-documentation

Gives stride and period units, table indexing, zero-stride meaning and the contact heuristic's limitation; texture is explicitly the GPU view of the CPU matrix array.
