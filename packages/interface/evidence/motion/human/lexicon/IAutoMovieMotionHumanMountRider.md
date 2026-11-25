# src/motion/human/lexicon/IAutoMovieMotionHumanMountRider.ts#IAutoMovieMotionHumanMountRider.IHoldGrip

## @evidence contracts/development/common.md#meaningful-documentation

point: Grip contact point in world metres. radius: Grip radius in metres; defaults to zero for a surface contact.

## @evidence contracts/development/design.md#principled-representation

point: Grip contact point in world metres. radius: Grip radius in metres; defaults to zero for a surface contact.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanMountRider.ts (HumanMountRider.hold, grip).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/lexicon/IAutoMovieMotionHumanMountRider.ts#IAutoMovieMotionHumanMountRider.IHoldResult

## @evidence contracts/development/common.md#meaningful-documentation

arm: World-space arm goal fitting the wrist to the grip. fingers: Clinical-degree finger rotations blended from the open pose to the supplied closure.

## @evidence contracts/development/design.md#principled-representation

arm: World-space arm goal fitting the wrist to the grip. fingers: Clinical-degree finger rotations blended from the open pose to the supplied closure.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanMountRider.ts (HumanMountRider.hold, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieHumanLimbGoal, IAutoMovieMotionHumanPosture identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
