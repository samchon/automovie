# src/motion/human/actions/IAutoMovieMotionHumanStand.ts#IAutoMovieMotionHumanStand.IParams

## @evidence contracts/development/common.md#meaningful-documentation

hold: How long to stand, seconds; 1.5 when absent. Exclusive minimum: 0. Unit: "s". sway: The postural sway's RMS on each floor axis, metres; the performer's own when absent (3 mm times the skill's sway factor, 1.0 to 1.6), and 0 for a stance that keeps exactly still, such as a reference scene a mirror or a difference is read against. on: A moving support stood on (#3491): a cart's bed, a deck. The stance is planned where the body stands at the entry and carried by the prop's motion from there, its feet planted on the prop. When absent, a prop already under both planted entry feet is continued; otherwise the feet retain their declared entry support frames.

## @evidence contracts/development/design.md#principled-representation

hold: How long to stand, seconds; 1.5 when absent. Exclusive minimum: 0. Unit: "s". sway: The postural sway's RMS on each floor axis, metres; the performer's own when absent (3 mm times the skill's sway factor, 1.0 to 1.6), and 0 for a stance that keeps exactly still, such as a reference scene a mirror or a difference is read against. on: A moving support stood on (#3491): a cart's bed, a deck. The stance is planned where the body stands at the entry and carried by the prop's motion from there, its feet planted on the prop. When absent, a prop already under both planted entry feet is continued; otherwise the feet retain their declared entry support frames.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: actions/stand.ts (stand.plan, context); chain/HumanChainTravel.ts (HumanChainTravel.stand, params); actions/stand.ts (stand.plan); handling/pushSled.ts (pushSled.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in stand.plan.
