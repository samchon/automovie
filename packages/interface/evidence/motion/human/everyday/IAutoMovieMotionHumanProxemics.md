# src/motion/human/everyday/IAutoMovieMotionHumanProxemics.ts#IAutoMovieMotionHumanProxemics.Band

## @evidence contracts/development/common.md#meaningful-documentation

The gap of a request between two people. A named gap.

## @evidence contracts/development/design.md#principled-representation

Closed choices "intimate", "faceToFace", "personal", "fighting", "social", "handing" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: everyday/HumanProxemics.ts (HumanProxemics.gap, request); everyday/HumanProxemics.ts (HumanProxemics.GAPS).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in HumanProxemics.gap.

# src/motion/human/everyday/IAutoMovieMotionHumanProxemics.ts#IAutoMovieMotionHumanProxemics.IStopResult

## @evidence contracts/development/common.md#meaningful-documentation

at: Stopped feet-midpoint position on the world floor, metres; it is the floor location used to place the body. yaw: Stopped body heading in degrees about world +Y.

## @evidence contracts/development/design.md#principled-representation

at: Stopped feet-midpoint position on the world floor, metres; it is the floor location used to place the body. yaw: Stopped body heading in degrees about world +Y.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: everyday/HumanProxemics.ts (HumanProxemics.stop, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
