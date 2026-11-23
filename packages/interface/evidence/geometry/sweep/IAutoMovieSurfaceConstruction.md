# src/geometry/sweep/IAutoMovieSurfaceConstruction.ts#IAutoMovieSurfaceConstruction

## @evidence contracts/development/design.md#principled-representation

Samples the actual sealed rig evaluators after their rest constraints, rather than reconstructing their input polylines.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A curve kind, source name, closure flag and packed positions.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Distinguishes raw sweep observations from cell-consistent generated network curves and from fitted or pinned cage controls.

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, units, filtering distinction and rest-only lifetime.

# src/geometry/sweep/IAutoMovieSurfaceConstruction.ts#IAutoMovieSurfaceConstruction.ISamples

## @evidence contracts/development/design.md#principled-representation

Counts set observation resolution independently of the cage's topology.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One count for closed stations, ordinary lines, each feature segment and network curves.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

All four named counts are required and validated as positive safe integers; stations need at least three and unknown keys are refused.

## @evidence contracts/development/common.md#meaningful-documentation

States count meanings, minimums and strict named-key admission.
