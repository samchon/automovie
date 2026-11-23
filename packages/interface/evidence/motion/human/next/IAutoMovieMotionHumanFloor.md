# src/motion/human/next/IAutoMovieMotionHumanFloor.ts#IAutoMovieMotionHumanFloor

## @evidence contracts/development/common.md#meaningful-documentation

States the family's shared model and what its methods have in common.

## @evidence contracts/development/design.md#principled-representation

One method per law of the Floor family, each taking the law's own parameter type.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The Floor laws and nothing the other families own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each method takes the existing parameter type of its law; nothing is redefined.

# src/motion/human/next/IAutoMovieMotionHumanFloor.ts#IAutoMovieMotionHumanFloor.ILieDownPreset

## @evidence contracts/development/common.md#meaningful-documentation

States what the preset fixes, which presets use it, how it is applied and where the members' meanings are.

## @evidence contracts/development/design.md#principled-representation

The lieDown law's own members, so a preset fixes only the values its row means and the law keeps every other default.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This family owns the preset shape; `lieDown` owns the members' meanings.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: the type names the pick of `lieDown`'s own members and redefines none.
