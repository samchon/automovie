# src/motion/human/daily/IAutoMovieMotionHumanHandToFaceArm.ts#IAutoMovieMotionHumanHandToFaceArm.IArm

## @evidence contracts/development/common.md#meaningful-documentation

lean: A vessel's lean toward the lips, degrees; absent for no vessel. facing: The level direction a vessel faces against; absent for no vessel searched.

## @evidence contracts/development/design.md#principled-representation

lean: A vessel's lean toward the lips, degrees; absent for no vessel. facing: The level direction a vessel faces against; absent for no vessel searched.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: daily/handToFaceArm.ts (handToFaceArm.of, return); daily/handToFace.ts (handToFace.plan); daily/handToFaceArm.ts (handToFaceArm.of).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanTouch.ITouch, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/daily/IAutoMovieMotionHumanHandToFaceArm.ts#IAutoMovieMotionHumanHandToFaceArm.IProps

## @evidence contracts/development/common.md#meaningful-documentation

own: The grasp a held tool was taken up by, which keeps its turn; null for none.

## @evidence contracts/development/design.md#principled-representation

own: The grasp a held tool was taken up by, which keeps its turn; null for none.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: daily/handToFaceArm.ts (handToFaceArm.of, props).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPosture, AutoMovieHumanSide, IAutoMovieMotionHumanTouchEffector.IEffector, IAutoMovieMotionHumanTarget.IPlace identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
