# src/motion/human/next/IAutoMovieMotionHumanAcrobatics.ts#IAutoMovieMotionHumanAcrobatics

## @evidence contracts/development/common.md#meaningful-documentation

States the family's shared model and what its methods have in common.

## @evidence contracts/development/design.md#principled-representation

One method per law of the Acrobatics family, each taking the law's own parameter type.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The Acrobatics laws and nothing the other families own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each method takes the existing parameter type of its law; nothing is redefined.

# src/motion/human/next/IAutoMovieMotionHumanAcrobatics.ts#IAutoMovieMotionHumanAcrobatics.IRoundOffPreset

## @evidence contracts/development/common.md#meaningful-documentation

States the one value the preset fixes and how it is applied.

## @evidence contracts/development/design.md#principled-representation `lead` is an `AutoMovieHumanSide`, the person's own side, as the round-off reads it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the fixed key of the rows `roundOffLeft` and `roundOffRight`; the law's other parameters stay open.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: the preset carries no value the law does not read.
