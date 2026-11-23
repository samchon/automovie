# src/motion/human/lexicon/IAutoMovieMotionHumanCarriedDrag.ts#IAutoMovieMotionHumanCarriedDrag

## @evidence contracts/development/common.md#meaningful-documentation

The carries in which the carried body trails on the floor (#3349): the armpit drag, the collar drag and the ankle drag. Each is a row of `HumanCarried.CARRIES`, read by `borne` and `bearing` like any carry; the dragger walks backward under `bearing`.

## @evidence contracts/development/design.md#principled-representation

Closed choices "armpitDrag", "collarDrag", "ankleDrag" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanCarriedDrag.ts (HumanCarriedDrag.CARRIES).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in HumanCarriedDrag.CARRIES.

# src/motion/human/lexicon/IAutoMovieMotionHumanCarriedDrag.ts#IAutoMovieMotionHumanCarriedDrag.Name

## @evidence contracts/development/common.md#meaningful-documentation

A drag's name.

## @evidence contracts/development/design.md#principled-representation

Closed choices "armpitDrag", "collarDrag", "ankleDrag" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanCarriedDrag.ts (HumanCarriedDrag.CARRIES).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in HumanCarriedDrag.CARRIES.
