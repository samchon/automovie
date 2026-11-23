# src/production/IAutoMoviePhysicalShapeBounds.ts#IAutoMoviePhysicalShapeBounds.IResult

## @evidence contracts/development/design.md#principled-representation

min/max are scene-world metres after composing body and local shape poses. Unit rotations, valid dimensions and nonempty finite hulls are admission premises; physicalShapeBounds does not validate them again.

## @evidence contracts/development/design.md#minimal-and-owned-surface

physicalShapeBounds produces these fresh corners for floor checks, support/contact geometry and humanoid measurements.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The box is a broad geometric extent, not proof of collision or support. Empty malformed hull input can produce infinite corners rather than a missing-result sentinel.

## @evidence contracts/development/common.md#meaningful-documentation

World-axis bounds of an already admitted physical shape placement. min/max are scene-world metres after composing body and local shape poses. Unit rotations, valid dimensions and nonempty finite hulls are admission premises; physicalShapeBounds does not validate them again.
