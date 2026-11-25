# src/human/generation/leg/IAutoMovieHumanLegAxis.ts#IAutoMovieHumanLegAxis.IFrame

## @evidence contracts/development/common.md#meaningful-documentation

A section plane, canonical, with its normal.

## @evidence contracts/development/design.md#principled-representation `origin`: Origin, on the axis. `u`: In-plane axis, forward in the straight leg. `v`: In-plane axis, lateral in the straight leg.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanLegAxis.frameAt, AutoMovieHumanLegAxis.frameRate. Read by AutoMovieHumanLegLaw.points, AutoMovieHumanLegReflection.placed, AutoMovieHumanLegSectionLaw.points. Also types AutoMovieHumanLegAxis.derive, AutoMovieHumanLegCentreLine.f.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `origin`, `u`, `v`, `n`; callers supply the complete record.

# src/human/generation/leg/IAutoMovieHumanLegAxis.ts#IAutoMovieHumanLegAxis.IJoints

## @evidence contracts/development/common.md#meaningful-documentation

The joints the axis passes through.

## @evidence contracts/development/design.md#principled-representation `hip`: Hip centre. `knee`: Knee centre. `ankle`: Ankle centre.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanLegChain.joints. Read by AutoMovieHumanLegAxis.of. Also types AutoMovieHumanLegChain.bones.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `hip`, `knee`, `ankle`; callers supply the complete record.

# src/human/generation/leg/IAutoMovieHumanLegAxis.ts#IAutoMovieHumanLegAxis.ITurn

## @evidence contracts/development/common.md#meaningful-documentation

One eased turn of the section normal about a fixed axis.

## @evidence contracts/development/design.md#principled-representation `from`: Station where the turn starts. `span`: Length of the turn along the stations, mm. `axis`: Unit axis.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanLegAxis.turn.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `from`, `span`, `axis`, `angle`; callers supply the complete record.

# src/human/generation/leg/IAutoMovieHumanLegAxis.ts#IAutoMovieHumanLegAxis.IFrames

## @evidence contracts/development/common.md#meaningful-documentation

The leg's frames along its stations.

## @evidence contracts/development/design.md#principled-representation `s0`: Station of the ankle ring. `s1`: Station of the crotch ring. `turns`: The three turns: ankle ring to shank, shank to thigh, thigh to the crotch ring.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanLegAxis.of. Read by AutoMovieHumanLegAxis.rotated, AutoMovieHumanLegAxis.frameAt, AutoMovieHumanLegAxis.frameRate. Also types AutoMovieHumanLegAxis.frames, AutoMovieHumanLegChain.frames.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `s0`, `s1`, `turns`, `twist`, `knee`, `origins`; callers supply the complete record.

# src/human/generation/leg/IAutoMovieHumanLegAxis.ts#IAutoMovieHumanLegAxis.InterpolatedRate

## @evidence contracts/development/common.md#meaningful-documentation

A table's value at s by cubic Hermite, with derivatives from `rate`.

## @evidence contracts/development/design.md#principled-representation

A table's value at s by cubic Hermite, with derivatives from `rate`. The callable takes s and returns AutoMovieVector3Tuple.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanLegAxis.InterpolatedRate is the canonical exchange used by AutoMovieHumanLegAxis.interpolated.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanLegAxis.interpolated for a table's value at s by cubic Hermite, with derivatives from `rate`.
