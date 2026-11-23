# src/motion/human/compose/IAutoMovieMotionHumanSwivelBound.ts#IAutoMovieMotionHumanSwivelBound

## @evidence contracts/development/common.md#meaningful-documentation

point: A point on the plane, world metres. margin: How far inside the elbow is kept, in the normal's units (metres for a unit normal). shoulder: The shoulder joint, world metres.

## @evidence contracts/development/design.md#principled-representation

point: A point on the plane, world metres. margin: How far inside the elbow is kept, in the normal's units (metres for a unit normal). shoulder: The shoulder joint, world metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: compose/AutoMovieMotionHumanSwivelBound.ts (AutoMovieMotionHumanSwivelBound.arm, return); compose/AutoMovieMotionHumanSwivelBound.ts (AutoMovieMotionHumanSwivelBound.bounded, of); compose/AutoMovieMotionHumanDrinkingSwivel.ts (AutoMovieMotionHumanDrinkingSwivel.bounded.bounds, return); compose/AutoMovieMotionHumanSwivelBound.ts (AutoMovieMotionHumanSwivelBound.bounded, bounds); compose/AutoMovieMotionHumanSwivelBound.ts (AutoMovieMotionHumanSwivelBound.bounded.past, bound); compose/AutoMovieMotionHumanDrinkingSwivel.ts (AutoMovieMotionHumanDrinkingSwivel.bounded).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/compose/IAutoMovieMotionHumanSwivelBound.ts#IAutoMovieMotionHumanSwivelBound.IHalfPlane

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and unit.

## @evidence contracts/development/design.md#principled-representation

A plane and how far inside it, the form every bound here takes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None optional.

# src/motion/human/compose/IAutoMovieMotionHumanSwivelBound.ts#IAutoMovieMotionHumanSwivelBound.IArm

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and unit.

## @evidence contracts/development/design.md#principled-representation

What fixes the elbow's circle for a wrist's place.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members, read by `bounded`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Read off the posed trunk, never estimated.
