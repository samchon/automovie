# src/motion/human/striking/IAutoMovieMotionHumanStrikingReach.ts#IAutoMovieMotionHumanStrikingReach

## @evidence contracts/development/common.md#meaningful-documentation

upper: Root to middle joint, metres. along: Middle joint to the chosen point along the distal segment, metres; the wrist or ankle itself when equal to `lower`. lower: Middle joint to end joint, metres.

## @evidence contracts/development/design.md#principled-representation

upper: Root to middle joint, metres. along: Middle joint to the chosen point along the distal segment, metres; the wrist or ankle itself when equal to `lower`. lower: Middle joint to end joint, metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: striking/KickChain.ts (KickChain.solve, return); striking/KickChain.ts (KickChain.fit, solved); striking/KickChain.ts (KickChain.read, solved); striking/StrikingReach.ts (StrikingReach.chain, return); striking/StrikingReach.ts (StrikingReach.hint, solution); striking/StrikingReach.ts (StrikingReach.chain, input).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/striking/IAutoMovieMotionHumanStrikingReach.ts#IAutoMovieMotionHumanStrikingReach.IChain

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its unit and meaning.

## @evidence contracts/development/design.md#principled-representation

World points, lengths in metres, a bend direction, a flexion band in degrees and whether the contact may slide; a parallel bend is refused by the solve.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What the triangle and the band need.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the interface vector.

# src/motion/human/striking/IAutoMovieMotionHumanStrikingReach.ts#IAutoMovieMotionHumanStrikingReach.ISolution

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its unit and meaning, the gap its sign.

## @evidence contracts/development/design.md#principled-representation

The joints and the landing point in world metres, the flexion in degrees, the contact's distance along the distal segment, a closed status union and a signed gap.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What the laws turn into goals and records.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.
