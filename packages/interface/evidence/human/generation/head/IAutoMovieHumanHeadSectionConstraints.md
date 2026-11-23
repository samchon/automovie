# src/human/generation/head/IAutoMovieHumanHeadSectionConstraints.ts#IAutoMovieHumanHeadSectionConstraints.Extents

## @evidence contracts/development/common.md#meaningful-documentation

Four signed-guide magnitudes, front/left/back/right, calibration mm.

## @evidence contracts/development/design.md#principled-representation

Four signed-guide magnitudes, front/left/back/right, calibration mm. Ordered tuple slots are 0, 1, 2, 3; fixed arity preserves their correspondence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanHeadSectionConstraints.lateral, AutoMovieHumanHeadSectionConstraints.frontal, AutoMovieHumanHeadSectionConstraints.radius.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanHeadSectionConstraints.lateral, AutoMovieHumanHeadSectionConstraints.frontal, AutoMovieHumanHeadSectionConstraints.radius, AutoMovieHumanHeadSectionConstraints.admit for four signed-guide magnitudes, front/left/back/right, calibration mm.
