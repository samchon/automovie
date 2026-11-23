# src/human/generation/IAutoMovieHumanShoulderLine.ts#IAutoMovieHumanShoulderLine.IPoint

## @evidence contracts/development/common.md#meaningful-documentation

The shoulder point's place on the outline.

## @evidence contracts/development/design.md#principled-representation `y`: Height of the shoulder point, mm. `z`: Its lateral place, mm: half the biacromial breadth the course input fixes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanShoulderLine.create.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `y`, `z`; callers supply the complete record.
