# src/motion/human/tasks/IAutoMovieMotionHumanToolWork.ts#IAutoMovieMotionHumanToolWork.Kind

## @evidence contracts/development/common.md#meaningful-documentation

A one-hand tool shaped as `createTool` shapes it, lying level on a bench with its working end ahead: a 0.3 m handle along its `+Y`, its `grip` taken from `-Z` near the butt and its `face` at the working end (a hammer's on the head's `+Z` side, a saw's teeth along `+Z`, a screwdriver's tip and a spoon's bowl). A kind of work.

## @evidence contracts/development/design.md#principled-representation

Closed choices "hammer", "saw", "stir", "screwdriver" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: executable/cases/toolCases.ts (held, kind); tasks/HumanToolWork.ts (HumanToolWork.of, work); executable/cases/toolCases.ts (toolCases); tasks/useTool.ts (useTool.PERIODS); tasks/useTool.ts (useTool.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in held.
