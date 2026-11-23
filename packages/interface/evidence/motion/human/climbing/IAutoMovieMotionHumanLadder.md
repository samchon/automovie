# src/motion/human/climbing/IAutoMovieMotionHumanLadder.ts#IAutoMovieMotionHumanLadder

## @evidence contracts/development/common.md#meaningful-documentation

ahead: The rungs' distance ahead in that frame, metres: 0, the frame's origin lying in their plane. spacing: The rung spacing, metres. radius: A rung's radius, metres.

## @evidence contracts/development/design.md#principled-representation

ahead: The rungs' distance ahead in that frame, metres: 0, the frame's origin lying in their plane. spacing: The rung spacing, metres. radius: A rung's radius, metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: climbing/HumanLadder.ts (HumanLadder.of, return); climbing/HumanLadder.ts (HumanLadder.rung, ladder); climbing/climbLadder.ts (climbLadder.plan); executable/cases/climbCases.ts (climbCases).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanFrame identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/climbing/IAutoMovieMotionHumanLadder.ts#IAutoMovieMotionHumanLadder.ILadder

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its frame and unit.

## @evidence contracts/development/design.md#principled-representation

The rungs' plane and spacing in the ladder's own floor frame, read off its prop at the start.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `rung` and the capture.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Plain numbers, each the prop's own.
