# src/motion/human/tasks/IAutoMovieMotionHumanUseTool.ts#IAutoMovieMotionHumanUseTool.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its default.

## @evidence contracts/development/design.md#principled-representation

The work, the held tool, the work point, the hand and the count.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Six members read by `plan`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No hand place or tool length is typed.

# src/motion/human/tasks/IAutoMovieMotionHumanUseTool.ts#IAutoMovieMotionHumanUseTool.IPlan

## @evidence contracts/development/common.md#meaningful-documentation

offset: The working point from the grip socket, in the hand's frame, metres. on: The work point, world metres.

## @evidence contracts/development/design.md#principled-representation

offset: The working point from the grip socket, in the hand's frame, metres. on: The work point, world metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: tasks/useTool.ts (useTool.plan, return); executable/cases/toolCases.ts (toolCases).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3, IAutoMovieMotionHumanToolWork.Kind identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
