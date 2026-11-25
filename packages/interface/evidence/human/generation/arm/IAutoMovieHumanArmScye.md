# src/human/generation/arm/IAutoMovieHumanArmScye.ts#IAutoMovieHumanArmScye.IRing

## @evidence contracts/development/common.md#meaningful-documentation

The ring's place, size, outline and jet.

## @evidence contracts/development/design.md#principled-representation `centre`: Mean of the arc's points, left frame, mm. `radius`: Mean distance of the arc's points from the centre, mm. `outline`: The arc's points as `[x, z]` in the level plane, closed.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanArmScye.of. Read by AutoMovieHumanArmLaw.of. Also types AutoMovieHumanArmConstruction.ring.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `centre`, `radius`, `outline`, `points`, `jets`; callers supply the complete record.
