# src/motion/human/striking/IAutoMovieMotionHumanDefenceOutcome.ts#IAutoMovieMotionHumanDefenceOutcome.Outcome

## @evidence contracts/development/common.md#meaningful-documentation

The namespace defines each class's margin band.

## @evidence contracts/development/design.md#principled-representation

A closed union of the three outcomes the margin bands partition.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The outcomes the defence law forces and reports.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/motion/human/striking/IAutoMovieMotionHumanDefenceOutcome.ts#IAutoMovieMotionHumanDefenceOutcome.IInput

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its unit, range and default.

## @evidence contracts/development/design.md#principled-representation

Film-second instants, a seconds duration, a share in [0, 1] and a factor band; the orderings and ranges are checked when deciding.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The values the decision reads; the stretch band lets a forced outcome scale the attack.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the skill type.

# src/motion/human/striking/IAutoMovieMotionHumanDefenceOutcome.ts#IAutoMovieMotionHumanDefenceOutcome.IDecision

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its unit and band.

## @evidence contracts/development/design.md#principled-representation

The outcome with the realised start, reaction, lead and margin in seconds, the attack's stretch and contact; an unmet forced outcome is refused, so no decision carries one.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What the defence law schedules and what audits and tests read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the outcome union.
