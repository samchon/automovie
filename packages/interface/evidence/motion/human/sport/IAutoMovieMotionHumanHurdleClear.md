# src/motion/human/sport/IAutoMovieMotionHumanHurdleClear.ts#IAutoMovieMotionHumanHurdleClear

## @evidence contracts/development/common.md#meaningful-documentation

hurdle: Scene id of the hurdle; its `top` bar edge and `bar` depth decide the barrier.

## @evidence contracts/development/design.md#principled-representation

hurdle: A scene id resolved by the law's prop reader through `HumanObstacle`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanGymnastics.ts (HumanGymnastics.hurdleClear, params); sport/hurdleClear.ts (hurdleClear.plan, context).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The take-off and lead feet follow from the run's planted foot; no speed or height is authored.

# src/motion/human/sport/IAutoMovieMotionHumanHurdleClear.ts#IAutoMovieMotionHumanHurdleClear.IParams

## @evidence contracts/development/common.md#meaningful-documentation

The one member states its meaning.

## @evidence contracts/development/design.md#principled-representation

The hurdle's scene id.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The one value the plan reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The legs are the run's: the planted foot takes off and the other leads.
