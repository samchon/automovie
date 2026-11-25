# src/motion/human/touch/IAutoMovieMotionHumanSelfAction.ts#IAutoMovieMotionHumanSelfAction.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and default.

## @evidence contracts/development/design.md#principled-representation

The action by name, the hand of a one-arm action and the repetitions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The values the plan reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A closed kind union.

# src/motion/human/touch/IAutoMovieMotionHumanSelfAction.ts#IAutoMovieMotionHumanSelfAction.Kind

## @evidence contracts/development/common.md#meaningful-documentation

Capture cases of the self-directed body actions (#3285) on one polygon man standing from quiet standing. The actions.

## @evidence contracts/development/design.md#principled-representation

Closed choices "stretch", "victory", "fistPump", "neckRoll", "shoulderRoll" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: executable/cases/selfCases.ts (selfCases); touch/selfAction.ts (selfAction.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in selfCases.
