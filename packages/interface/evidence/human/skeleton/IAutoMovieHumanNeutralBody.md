# src/human/skeleton/IAutoMovieHumanNeutralBody.ts#IAutoMovieHumanNeutralBody

## @evidence contracts/development/common.md#meaningful-documentation

What every piece of the neutral posture reads of a body's bind skeleton.

## @evidence contracts/development/design.md#principled-representation `byBone`: The bind joints by bone, calibration millimetres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanNeutralTurn.body. Read by AutoMovieHumanNeutralAnkle.derive, AutoMovieHumanNeutralForearm.derive, AutoMovieHumanNeutralHip.derive. Also types AutoMovieHumanNeutral.body.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `byBone`; callers supply the complete record.
