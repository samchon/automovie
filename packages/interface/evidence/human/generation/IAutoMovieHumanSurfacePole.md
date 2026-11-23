# src/human/generation/IAutoMovieHumanSurfacePole.ts#IAutoMovieHumanSurfacePole

## @evidence contracts/development/common.md#meaningful-documentation

Surface pole closing a chain end.

## @evidence contracts/development/design.md#principled-representation `chain` and `end` locate the closure; `point` is a registered-frame position in millimetres. `critical` records the producer's critical-pole designation, including constructed digit tips, rather than certifying measured provenance.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanBodySurfacePoles.calibrated, AutoMovieHumanNeckSurface.crown.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `chain`, `end`, `point`, `critical`; callers supply the complete record.
