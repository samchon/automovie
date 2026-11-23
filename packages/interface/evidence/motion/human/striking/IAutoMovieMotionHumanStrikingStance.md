# src/motion/human/striking/IAutoMovieMotionHumanStrikingStance.ts#IAutoMovieMotionHumanStrikingStance

## @evidence contracts/development/common.md#meaningful-documentation

line: Heading of the line toward the opponent, degrees about +Y (0 faces +Z).

## @evidence contracts/development/design.md#principled-representation

line: Heading of the line toward the opponent, degrees about +Y (0 faces +Z).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: striking/StrikingStance.ts (StrikingStance.rear, stance); striking/StrikingStance.ts (StrikingStance.heading, stance); striking/StrikingStance.ts (StrikingStance.feet, stance); striking/StrikingStance.ts (StrikingStance.guard, stance); striking/guard.ts (guard.build).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in StrikingStance.rear.

# src/motion/human/striking/IAutoMovieMotionHumanStrikingStance.ts#IAutoMovieMotionHumanStrikingStance.IStance

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and the heading's convention.

## @evidence contracts/development/design.md#principled-representation

A closed lead union and a heading in degrees about +Y.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two values every stance query reads; queries needing only the lead take that part.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.
