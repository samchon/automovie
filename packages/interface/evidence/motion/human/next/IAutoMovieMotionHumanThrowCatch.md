# src/motion/human/next/IAutoMovieMotionHumanThrowCatch.ts#IAutoMovieMotionHumanThrowCatch

## @evidence contracts/development/common.md#meaningful-documentation

States the family's shared model and what its methods have in common.

## @evidence contracts/development/design.md#principled-representation

One method per law of the ThrowCatch family, each taking the law's own parameter type.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The ThrowCatch laws and nothing the other families own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each method takes the existing parameter type of its law; nothing is redefined.

# src/motion/human/next/IAutoMovieMotionHumanThrowCatch.ts#IAutoMovieMotionHumanThrowCatch.IStylePreset

## @evidence contracts/development/common.md#meaningful-documentation

States what the preset fixes, how it is applied and where the style's values are.

## @evidence contracts/development/design.md#principled-representation

One required member, the throw's own style, so a preset fixes exactly it and the throw keeps every other default.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This family owns the preset shape; the `AutoMovieMotionHumanThrowCatch` throw presets are its data and the sport-throw rows read them.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: the member is named once here instead of an inline pick of the throw's parameters.

# src/motion/human/next/IAutoMovieMotionHumanThrowCatch.ts#IAutoMovieMotionHumanThrowCatch.IHandsPreset

## @evidence contracts/development/common.md#meaningful-documentation

States what the preset fixes and how it is applied.

## @evidence contracts/development/design.md#principled-representation

One required member, the catch's own hand count.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This family owns the preset shape; the catch presets are its data and the sport-throw rows read them.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: the member is named once here instead of an inline pick of the catch's parameters.

# src/motion/human/next/IAutoMovieMotionHumanThrowCatch.ts#IAutoMovieMotionHumanThrowCatch.IFootPreset

## @evidence contracts/development/common.md#meaningful-documentation

States what the preset fixes and how it is applied.

## @evidence contracts/development/design.md#principled-representation

One required member, the kicking foot, on the canonical side type.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This family owns the preset shape; the kick presets are its data and the sport-throw rows read them.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: the member is named once here instead of an inline pick of the kick's parameters.
