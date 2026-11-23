# src/cinematics/IAutoMovieGrammarSubjectObservation.ts#IAutoMovieGrammarSubjectObservation

## @evidence contracts/development/design.md#principled-representation

Shot size is the larger of the vertical occupancy, the projected span between `start` and a point `height` above it, and the horizontal occupancy `radius / (depth * tan(fovY / 2) * aspect)`, mirroring the two-axis fit the camera solve took the larger of; screen direction and cut angle are read from the boundary points.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Carries two boundary points, two extents and an optional eyeline, the minimum every grammar check reads, so the analyzer needs no scene, model or clip.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No subject kind is special-cased: a figure and a facade are both measured by height and radius, and an unobserved eyeline is stated as null, which skips the eyeline check, rather than being assumed level or forward.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer and why it shares the camera solve's measurement, the failure effect of each malformed field, the metre units, the bottom-centre convention of the points, when `radius` decides the size, and what a null eyeline means.
