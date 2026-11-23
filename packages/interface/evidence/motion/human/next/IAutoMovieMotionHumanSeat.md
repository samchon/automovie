# src/motion/human/next/IAutoMovieMotionHumanSeat.ts#IAutoMovieMotionHumanSeat

## @evidence contracts/development/common.md#meaningful-documentation

States the family's shared model and what its methods have in common.

## @evidence contracts/development/design.md#principled-representation

One method per law of the Seat family, each taking the law's own parameter type.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The Seat laws and nothing the other families own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each method takes the existing parameter type of its law; nothing is redefined.

# src/motion/human/next/IAutoMovieMotionHumanSeat.ts#IAutoMovieMotionHumanSeat.IKneelPreset

## @evidence contracts/development/common.md#meaningful-documentation

States what the preset fixes, which presets use it, how it is applied and where the members' meanings are.

## @evidence contracts/development/design.md#principled-representation

The kneel law's own members, so a preset fixes only the values its row means and the law keeps every other default.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This family owns the preset shape; `kneel` owns the members' meanings.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: the type names the pick of `kneel`'s own members and redefines none.
