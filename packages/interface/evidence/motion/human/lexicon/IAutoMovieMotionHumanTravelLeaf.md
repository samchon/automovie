# src/motion/human/lexicon/IAutoMovieMotionHumanTravelLeaf.ts#IAutoMovieMotionHumanTravelLeaf.IParams

## @evidence contracts/development/common.md#meaningful-documentation

duration: Seconds the hand holds the handle, from the start of the reach; more than the reach's `TAKE`. Exclusive minimum: 0.6. Unit: "s". hand: The hand; the right when absent.

## @evidence contracts/development/design.md#principled-representation

duration: Seconds the hand holds the handle, from the start of the reach; more than the reach's `TAKE`. Exclusive minimum: 0.6. Unit: "s". hand: The hand; the right when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanTravelLeaf.ts (HumanTravelLeaf.openDoor, context); lexicon/HumanTravelLeaf.ts (HumanTravelLeaf.openDoor).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in HumanTravelLeaf.openDoor.
