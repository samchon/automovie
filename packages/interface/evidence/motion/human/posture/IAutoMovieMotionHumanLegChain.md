# src/motion/human/posture/IAutoMovieMotionHumanLegChain.ts#IAutoMovieMotionHumanLegChain.IPosed

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its frame.

## @evidence contracts/development/design.md#principled-representation

The joints and the two bones' world rotations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Five members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/motion/human/posture/IAutoMovieMotionHumanLegChain.ts#IAutoMovieMotionHumanLegChain.ISwivel

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its unit.

## @evidence contracts/development/design.md#principled-representation

The engine's branch order and swivel.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/motion/human/posture/IAutoMovieMotionHumanLegChain.ts#IAutoMovieMotionHumanLegChain.ISeededResult

## @evidence contracts/development/common.md#meaningful-documentation

swivel: Chosen leg-fit branch index and its swivel angle in degrees. seed: Continuation seed returned by the chosen hinged candidate; null when the fit result is not a hinged candidate, even independently of whether a previous seed was supplied.

## @evidence contracts/development/design.md#principled-representation

swivel: Chosen leg-fit branch index and its swivel angle in degrees. seed: Continuation seed returned by the chosen hinged candidate; null when the fit result is not a hinged candidate, even independently of whether a previous seed was supplied.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanLegChain.ts (HumanLegChain.seeded, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanLegChain.ISwivel, IAutoMovieSwivelSeed identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
