# src/motion/human/next/IAutoMovieMotionHumanDefence.ts#IAutoMovieMotionHumanDefence

## @evidence contracts/development/common.md#meaningful-documentation

States the family's shared model and what its methods have in common.

## @evidence contracts/development/design.md#principled-representation

One method per law of the Defence family, each taking the law's own parameter type.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The Defence laws and nothing the other families own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each method takes the existing parameter type of its law; nothing is redefined.

# src/motion/human/next/IAutoMovieMotionHumanDefence.ts#IAutoMovieMotionHumanDefence.IDefendPreset

## @evidence contracts/development/common.md#meaningful-documentation

States what the preset fixes, how it is applied and where its member's meaning is.

## @evidence contracts/development/design.md#principled-representation

One required member typed by the defend law's own named union, so a preset always fixes exactly the kind.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This family owns the preset shape; `AutoMovieMotionHumanDefence.COVER`, `HAND_PARRY`, `ELBOW_BLOCK`, `HIGH_BLOCK`, `CHECK_KICK`, `SLIP`, `ROLL_UNDER` and `SWAY_BACK` are its data and the lexicon rows of the same names read them.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: the member is named once here instead of an inline pick of the defence's parameters.

# src/motion/human/next/IAutoMovieMotionHumanDefence.ts#IAutoMovieMotionHumanDefence.IDefendRow

## @evidence contracts/development/common.md#meaningful-documentation

Names the parameters a defence row takes and the one it fixes.

## @evidence contracts/development/design.md#principled-representation

The defend law's own parameters less exactly the member of `IDefendPreset`, so a row cannot be given what its preset fixes.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanDefend.IParams` owns the shape; the lexicon's defence map names the rows' parameters by this alias.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: one named projection instead of an inline `Omit` in every row.
