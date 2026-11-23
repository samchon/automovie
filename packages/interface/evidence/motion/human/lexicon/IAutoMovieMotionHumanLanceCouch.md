# src/motion/human/lexicon/IAutoMovieMotionHumanLanceCouch.ts#IAutoMovieMotionHumanLanceCouch

## @evidence contracts/development/common.md#meaningful-documentation

on: The horse's subject id. frame: Its seat contact. prop: The lance's subject id. target: The target's prop and point. lower: Seconds the point takes to come onto the target's line, and to come back up after the strike. duration: How long the act lasts.

## @evidence contracts/development/design.md#principled-representation

Subject and affordance ids and seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The parameters `HumanLanceCouch` reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The strike's instant is the course's own, where the lowered point first reaches the target; nothing is cued.

# src/motion/human/lexicon/IAutoMovieMotionHumanLanceCouch.ts#IAutoMovieMotionHumanLanceCouch.ITarget

## @evidence contracts/development/common.md#meaningful-documentation

prop: The target's subject id. point: Its affordance the point meets.

## @evidence contracts/development/design.md#principled-representation

Two ids.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `HumanLanceCouch`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.
