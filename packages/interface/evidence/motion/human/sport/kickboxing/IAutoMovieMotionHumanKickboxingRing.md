# src/motion/human/sport/kickboxing/IAutoMovieMotionHumanKickboxingRing.ts#IAutoMovieMotionHumanKickboxingRing.IRing

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its frame and unit.

## @evidence contracts/development/design.md#principled-representation

A centre in world metres, a side in metres (positive) and a heading in degrees about +Y; positivity is left to the queries.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The three values every query reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the interface vector.

# src/motion/human/sport/kickboxing/IAutoMovieMotionHumanKickboxingRing.ts#IAutoMovieMotionHumanKickboxingRing.Corner

## @evidence contracts/development/common.md#meaningful-documentation

Names the four corners; the namespace places them on the diagonals.

## @evidence contracts/development/design.md#principled-representation

A closed union of the four corners a ring has.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The corners the corner query and the knockdown count name.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.
