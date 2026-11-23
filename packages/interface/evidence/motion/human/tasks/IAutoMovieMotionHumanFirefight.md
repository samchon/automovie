# src/motion/human/tasks/IAutoMovieMotionHumanFirefight.ts#IAutoMovieMotionHumanFirefight.Role

## @evidence contracts/development/common.md#meaningful-documentation

Names the two hose-team roles; the namespace states what the nozzle operator does.

## @evidence contracts/development/design.md#principled-representation

A closed union of the nozzle operator and the backup member on one hose line.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The hose drill's parameters read it and `hoseLine.plan` branches on it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One literal per role, with no optional fields to combine.

# src/motion/human/tasks/IAutoMovieMotionHumanFirefight.ts#IAutoMovieMotionHumanFirefight.IExtinguish

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning, unit and default.

## @evidence contracts/development/design.md#principled-representation

A prop, a target, a count, degrees and seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `extinguish.plan`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The law refuses a target the nozzle cannot reach.

# src/motion/human/tasks/IAutoMovieMotionHumanFirefight.ts#IAutoMovieMotionHumanFirefight.IHoseLine

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning, unit and default.

## @evidence contracts/development/design.md#principled-representation

A prop, a role, an affordance id, metres, a target and a count.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `hoseLine.plan`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Only the nozzle operator opens the bail and sweeps.

# src/motion/human/tasks/IAutoMovieMotionHumanFirefight.ts#IAutoMovieMotionHumanFirefight.IBeatFlames

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and default.

## @evidence contracts/development/design.md#principled-representation

A prop, a partner, a region and a count.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `beatFlames.plan`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each stroke lands on the named region.

# src/motion/human/tasks/IAutoMovieMotionHumanFirefight.ts#IAutoMovieMotionHumanFirefight.IStopDropRoll

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and default.

## @evidence contracts/development/design.md#principled-representation

A count of rolls.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `stopDropRoll.plan`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The hands stay on the face through the roll.
