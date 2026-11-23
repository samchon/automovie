# src/motion/human/next/IAutoMovieMotionHumanStance.ts#IAutoMovieMotionHumanStance

## @evidence contracts/development/common.md#meaningful-documentation

States the family's shared model and what its methods have in common.

## @evidence contracts/development/design.md#principled-representation

One method per law of the Stance family, each taking the law's own parameter type.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The Stance laws and nothing the other families own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each method takes the existing parameter type of its law; nothing is redefined.

# src/motion/human/next/IAutoMovieMotionHumanStance.ts#IAutoMovieMotionHumanStance.IRestPreset

## @evidence contracts/development/common.md#meaningful-documentation

States what the preset fixes, which presets use it, how it is applied and where the places' meanings are.

## @evidence contracts/development/design.md#principled-representation

The rest law's own `left` and `right` members, so a preset fixes exactly the two places and the law keeps every other default.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This family owns the preset shape; `rest` owns the places' meanings.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: the type names the pick of `rest`'s own members and redefines none.

# src/motion/human/next/IAutoMovieMotionHumanStance.ts#IAutoMovieMotionHumanStance.IStandPreset

## @evidence contracts/development/common.md#meaningful-documentation

States what the preset fixes, which preset uses it, how it is applied and where the member's meaning is.

## @evidence contracts/development/design.md#principled-representation

The stand law's own `hold` member, so a preset fixes exactly the hold and the law keeps every other default.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This family owns the preset shape; `stand` owns the hold's meaning.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: the type names the pick of `stand`'s own member and redefines none.

# src/motion/human/next/IAutoMovieMotionHumanStance.ts#IAutoMovieMotionHumanStance.ICrouchPreset

## @evidence contracts/development/common.md#meaningful-documentation

States what the preset fixes, which presets use it, how it is applied and where the members' meanings are.

## @evidence contracts/development/design.md#principled-representation

The crouch law's own members, so a preset fixes only the values its row means and the law keeps every other default.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This family owns the preset shape; `crouch` owns the members' meanings.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: the type names the pick of `crouch`'s own members and redefines none.
