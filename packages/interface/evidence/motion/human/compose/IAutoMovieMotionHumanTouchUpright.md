# src/motion/human/compose/IAutoMovieMotionHumanTouchUpright.ts#IAutoMovieMotionHumanTouchUpright

## @evidence contracts/development/common.md#meaningful-documentation

lean: How far the vessel's axis is asked to lean from the world's up toward the region, degrees (`AutoMovieMotionHumanTouchDrink`); 0 from `solve`. tilt: How far the reached hand carries the vessel's axis off the asked one, degrees; 0 when the region's normal has no level part.

## @evidence contracts/development/design.md#principled-representation

lean: How far the vessel's axis is asked to lean from the world's up toward the region, degrees (`AutoMovieMotionHumanTouchDrink`); 0 from `solve`. tilt: How far the reached hand carries the vessel's axis off the asked one, degrees; 0 when the region's normal has no level part.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: compose/AutoMovieMotionHumanTouchUpright.ts (AutoMovieMotionHumanTouchUpright.solve, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/compose/IAutoMovieMotionHumanTouchUpright.ts#IAutoMovieMotionHumanTouchUpright.IFacing

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning, frame and unit.

## @evidence contracts/development/design.md#principled-representation

The chosen level direction and lean with the residual it was chosen by.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members: the stroke reads the facing and the lean, a choice among several effectors the tilt.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The tilt is the reached one, never the asked one.
