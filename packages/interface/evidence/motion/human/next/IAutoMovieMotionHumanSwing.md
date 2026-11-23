# src/motion/human/next/IAutoMovieMotionHumanSwing.ts#IAutoMovieMotionHumanSwing

## @evidence contracts/development/common.md#meaningful-documentation

States the family's shared model and what its methods have in common.

## @evidence contracts/development/design.md#principled-representation

One method per law of the Swing family, each taking the law's own parameter type.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The Swing laws and nothing the other families own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each method takes the existing parameter type of its law; nothing is redefined.

# src/motion/human/next/IAutoMovieMotionHumanSwing.ts#IAutoMovieMotionHumanSwing.Hands

## @evidence contracts/development/common.md#meaningful-documentation

Names the two grips a swing preset fixes.

## @evidence contracts/development/design.md#principled-representation

A closed union of the swing's hand counts, as `IAutoMovieMotionHumanSword.IWield.hands`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two-hand swing presets read it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One literal per hand count, with no optional fields to combine.

# src/motion/human/next/IAutoMovieMotionHumanSwing.ts#IAutoMovieMotionHumanSwing.IStrokePreset

## @evidence contracts/development/common.md#meaningful-documentation

States what the preset fixes, how it is applied and which rows read it.

## @evidence contracts/development/design.md#principled-representation

One required member, the cut's own line, so a preset fixes exactly it and the cut keeps every other default.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This family owns the preset shape; the `AutoMovieMotionHumanSwing` stroke presets are its data and the sport-swing rows read them.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: the member is named once here instead of an inline pick of the cut's parameters.

# src/motion/human/next/IAutoMovieMotionHumanSwing.ts#IAutoMovieMotionHumanSwing.IGripPreset

## @evidence contracts/development/common.md#meaningful-documentation

States what the preset fixes, how it is applied and which rows read it.

## @evidence contracts/development/design.md#principled-representation

Two required members, the cut's own line and grip.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This family owns the preset shape; the grip presets are its data and the sport-swing rows read them.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: the members are named once here instead of an inline pick of the cut's parameters.

# src/motion/human/next/IAutoMovieMotionHumanSwing.ts#IAutoMovieMotionHumanSwing.ICheckPreset

## @evidence contracts/development/common.md#meaningful-documentation

States what the preset fixes, how it is applied and which row reads it.

## @evidence contracts/development/design.md#principled-representation

Three required members: the cut's line, its grip and its feint share in (0, 1).

## @evidence contracts/development/design.md#minimal-and-owned-surface

This family owns the preset shape; the check preset is its data and the checkSwing row reads it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: the members are named once here instead of an inline pick of the cut's parameters.

# src/motion/human/next/IAutoMovieMotionHumanSwing.ts#IAutoMovieMotionHumanSwing.IBuntPreset

## @evidence contracts/development/common.md#meaningful-documentation

States what the preset fixes, how it is applied and which row reads it.

## @evidence contracts/development/design.md#principled-representation

Two required members, the guard's own name and grip.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This family owns the preset shape; the bunt preset is its data and the bunt row reads it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: the members are named once here instead of an inline pick of the guard's parameters.
