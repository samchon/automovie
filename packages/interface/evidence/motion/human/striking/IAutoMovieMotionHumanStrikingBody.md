# src/motion/human/striking/IAutoMovieMotionHumanStrikingBody.ts#IAutoMovieMotionHumanStrikingBody.IRegionResult

## @evidence contracts/development/common.md#meaningful-documentation

point: Struck body-region contact point in world metres. normal: Outward normal of the struck body region in world coordinates.

## @evidence contracts/development/design.md#principled-representation

point: Struck body-region contact point in world metres. normal: Outward normal of the struck body region in world coordinates.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: striking/StrikingBody.ts (StrikingBody.region, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
