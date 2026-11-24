# src/typography/IAutoMovieBuildTextGeometry.ts#IAutoMovieBuildTextGeometry

## @evidence contracts/development/common.md#meaningful-documentation

States the box frame with `+z` toward the reader that both geometry inputs share.

## @evidence contracts/development/design.md#principled-representation

Extends the layout frame by the face normal, so flat and raised text share one coordinate system.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Serves buildAutoMovieTextGeometry and buildAutoMovieRaisedLettering only.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Flat and raised inputs are separate types, so a flat build never carries a depth.

# src/typography/IAutoMovieBuildTextGeometry.ts#IAutoMovieBuildTextGeometry.IProps

## @evidence contracts/development/common.md#meaningful-documentation

States the chord tolerance's unit, default, positivity and the step rule it drives.

## @evidence contracts/development/design.md#principled-representation

A tolerance in metres bounds the geometric error of flattening, the one free parameter of curve-to-chord conversion.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Both builders read it; the rest is the layout input.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The step count is derived from the tolerance, not exposed as a second knob that could contradict it.

# src/typography/IAutoMovieBuildTextGeometry.ts#IAutoMovieBuildTextGeometry.IRaisedProps

## @evidence contracts/development/common.md#meaningful-documentation

States the relief depth's unit, positivity and the z span it produces.

## @evidence contracts/development/design.md#principled-representation

A metre depth along the face normal is the extrusion's only extra quantity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read only by buildAutoMovieRaisedLettering.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Depth is required, so raised lettering never defaults to a flat or arbitrary relief.
