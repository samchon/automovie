# src/motion/human/next/IAutoMovieMotionHumanSwim.ts#IAutoMovieMotionHumanSwim

## @evidence contracts/development/design.md#minimal-and-owned-surface

The Swim laws and nothing the other families own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each method takes the existing parameter type of its law; nothing is redefined.

## @evidence contracts/development/common.md#meaningful-documentation

water: The water plane's world height, metres; the entry's chest height when absent. count: Cycles; 3 when absent. Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless.

## @evidence contracts/development/design.md#principled-representation

water: The water plane's world height, metres; the entry's chest height when absent. count: Cycles; 3 when absent. Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless.

# src/motion/human/next/IAutoMovieMotionHumanSwim.ts#IAutoMovieMotionHumanSwim.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and default.

## @evidence contracts/development/design.md#principled-representation

The stroke, the plane's height and the cycle count.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The values the plan reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The plane is a world height the author states.

# src/motion/human/next/IAutoMovieMotionHumanSwim.ts#IAutoMovieMotionHumanSwim.Kind

## @evidence contracts/development/common.md#meaningful-documentation

Capture cases of swimming (#3254) on a water plane at 1.2 m, drawn as a thin box, three cycles each. The strokes.

## @evidence contracts/development/design.md#principled-representation

Closed choices "treadWater", "frontCrawl" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: executable/cases/swimCases.ts (swimCases).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanSwimStroke.Name identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
