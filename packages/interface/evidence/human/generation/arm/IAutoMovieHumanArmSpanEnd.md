# src/human/generation/arm/IAutoMovieHumanArmSpanEnd.ts#IAutoMovieHumanArmSpanEnd

## @evidence contracts/development/common.md#meaningful-documentation

Boundary passed from one consecutive arm span to the next.

## @evidence contracts/development/design.md#principled-representation `row`: Physical terminal section inherited by the next arm span. `knot`: Walk station followed by target girth, both calibration millimetres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanArmSpanEnd is the canonical exchange used by AutoMovieHumanDeltoidSpan.end, AutoMovieHumanElbowSpan.end, AutoMovieHumanForearmBelly.end, AutoMovieHumanUpperArmCompartments.end.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `row`, `knot`; callers supply the complete record.
