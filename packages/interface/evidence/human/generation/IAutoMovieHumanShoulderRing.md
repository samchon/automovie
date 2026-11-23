# src/human/generation/IAutoMovieHumanShoulderRing.ts#IAutoMovieHumanShoulderRing.IInput

## @evidence contracts/development/common.md#meaningful-documentation

What a shoulder ring reads.

## @evidence contracts/development/design.md#principled-representation `column`: The torso's column through the shoulders. `line`: The trapezius line, from the shoulder point to the neck's ring. `oval`: The arm's ellipse and its cap.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanShoulderRing.wall, AutoMovieHumanShoulderRing.controls. Also types AutoMovieHumanTrunkChains.shoulder.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `column`, `line`, `oval`, `axilla`; callers supply the complete record.
