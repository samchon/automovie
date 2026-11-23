# src/motion/human/carrying/IAutoMovieMotionHumanCarry.ts#IAutoMovieMotionHumanCarry

## @evidence contracts/development/common.md#meaningful-documentation

to: The floor point walked to, world metres. hand: The loaded side for `oneHand` and `hip`; `right` when absent. load: The load's mass as a share of the body's, in [0, 0.25]; 0.1 when absent. Inclusive minimum: 0. Inclusive maximum: 0.25. Unit: dimensionless.

## @evidence contracts/development/design.md#principled-representation

to: The floor point walked to, world metres. hand: The loaded side for `oneHand` and `hip`; `right` when absent. load: The load's mass as a share of the body's, in [0, 0.25]; 0.1 when absent. Inclusive minimum: 0. Inclusive maximum: 0.25. Unit: dimensionless.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: carrying/carry.ts (carry.place, how); carrying/carry.ts (carry.place, return); carrying/carry.ts (carry.plan, context); chain/HumanChainTravel.ts (HumanChainTravel.carry, params); carrying/carry.ts (carry.tilt); carrying/carry.ts (carry.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3, AutoMovieHumanSide, IAutoMovieMotionHumanGait.WalkPace and IAutoMovieMotionManner identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/carrying/IAutoMovieMotionHumanCarry.ts#IAutoMovieMotionHumanCarry.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its unit and default.

## @evidence contracts/development/design.md#principled-representation

The walk's destination, pace and manner, the way of carrying, the side and the load's mass share.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Six members read by `plan`; the manner's type is the walk's.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No hand place is typed.

# src/motion/human/carrying/IAutoMovieMotionHumanCarry.ts#IAutoMovieMotionHumanCarry.How

## @evidence contracts/development/common.md#meaningful-documentation

States the four ways a load is held.

## @evidence contracts/development/design.md#principled-representation

Closed choices "oneHand", "twoHands", "hip", "push" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: carrying/carry.ts (carry.place, how); carrying/carry.ts (carry.tilt); carrying/carry.ts (carry.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in carry.place.

# src/motion/human/carrying/IAutoMovieMotionHumanCarry.ts#IAutoMovieMotionHumanCarry.IPlaceResult

## @evidence contracts/development/common.md#meaningful-documentation

point: Carrying contact point in world metres. normal: Outward normal of the contacted surface in world coordinates.

## @evidence contracts/development/design.md#principled-representation

point: Carrying contact point in world metres. normal: Outward normal of the contacted surface in world coordinates.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: carrying/carry.ts (carry.place, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
