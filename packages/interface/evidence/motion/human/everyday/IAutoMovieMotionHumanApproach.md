# src/motion/human/everyday/IAutoMovieMotionHumanApproach.ts#IAutoMovieMotionHumanApproach.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each field states its meaning, frame and the default an absent value takes.

## @evidence contracts/development/design.md#principled-representation

The target is the shared motion target union; the gap is a named proxemic band or metres; the side is a closed union in the person's own frame; invalid metres and a side on a non-person target are refused at plan time.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by this law and read only by its plan; the band, pace, manner and Effort types are imported from their owners (HumanProxemics, walk, HumanEffort).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No field names one scene or body; `side` and `avoid` combine freely, and the one meaningless combination, a side of a prop or point, is refused rather than encoded.

# src/motion/human/everyday/IAutoMovieMotionHumanApproach.ts#IAutoMovieMotionHumanApproach.IAim

## @evidence contracts/development/common.md#meaningful-documentation

point: The point, world metres.

## @evidence contracts/development/design.md#principled-representation

point: The point, world metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: everyday/approach.ts (approach.to, aimed); everyday/approach.ts (approach.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
