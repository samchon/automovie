# src/motion/human/sport/kickboxing/IAutoMovieMotionHumanKickboxingRing.ts#IAutoMovieMotionHumanKickboxingRing

## @evidence contracts/development/common.md#meaningful-documentation

centre: The centre on the floor, world metres. size: The side between the ropes, metres; positive. yaw: The heading of the ring's +Z side, degrees about +Y.

## @evidence contracts/development/design.md#principled-representation

centre: The centre on the floor, world metres. size: The side between the ropes, metres; positive. yaw: The heading of the ring's +Z side, degrees about +Y.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: sport/kickboxing/KickboxingRing.ts (KickboxingRing.corner, corner); sport/kickboxing/KickboxingRing.ts (KickboxingRing.of, return); sport/kickboxing/KickboxingRing.ts (KickboxingRing.corner, ring); sport/kickboxing/KickboxingRing.ts (KickboxingRing.inside, ring); sport/kickboxing/KickboxingRing.ts (KickboxingRing.clamp, ring); sport/kickboxing/KickboxingRing.ts (KickboxingRing.world, ring).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

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
