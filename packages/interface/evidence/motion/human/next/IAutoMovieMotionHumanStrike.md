# src/motion/human/next/IAutoMovieMotionHumanStrike.ts#IAutoMovieMotionHumanStrike

## @evidence contracts/development/common.md#meaningful-documentation

States the family's shared model and what its methods have in common.

## @evidence contracts/development/design.md#principled-representation

One method per law of the Strike family, each taking the law's own parameter type.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The Strike laws and nothing the other families own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each method takes the existing parameter type of its law; nothing is redefined.

# src/motion/human/next/IAutoMovieMotionHumanStrike.ts#IAutoMovieMotionHumanStrike.IPunchPreset

## @evidence contracts/development/common.md#meaningful-documentation

States what the preset fixes, how it is applied and where its members' meanings are.

## @evidence contracts/development/design.md#principled-representation

Two required members typed by the punch law's own named unions, so a preset always fixes exactly the technique and the hand and the punch keeps every other default.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This family owns the preset shape; `AutoMovieMotionHumanStrike.JAB`, `CROSS`, `LEAD_HOOK`, `REAR_HOOK`, `LEAD_UPPERCUT`, `REAR_UPPERCUT`, `CHAIN_PUNCH`, `REAR_CHAIN_PUNCH`, `BACKFIST`, `HAMMERFIST` and `PALM_HEEL` are its data and the lexicon rows of the same names read them.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: the members are named once here instead of an inline pick of the punch's parameters.

# src/motion/human/next/IAutoMovieMotionHumanStrike.ts#IAutoMovieMotionHumanStrike.IFootStrikePreset

## @evidence contracts/development/common.md#meaningful-documentation

States what the preset fixes, how it is applied and where its members' meanings are.

## @evidence contracts/development/design.md#principled-representation

The technique and the leg are required and typed by the foot strike's own named unions; `spin` and `jump` are fixed only by the strikes that turn or leave the floor, so the foot strike keeps its defaults otherwise.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This family owns the preset shape; `AutoMovieMotionHumanStrike.MEIA_LUA_DE_FRENTE`, `ARMADA`, `SIDE_KICK`, `BACK_KICK`, `HOOK_KICK`, `CRESCENT_KICK`, `AXE_KICK`, `STOMP`, `LEG_SWEEP`, `SPINNING_HOOK_KICK` and `JUMPING_SIDE_KICK` are its data and the lexicon rows of the same names read them.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: the members are named once here instead of an inline pick of the foot strike's parameters.

# src/motion/human/next/IAutoMovieMotionHumanStrike.ts#IAutoMovieMotionHumanStrike.ICloseStrikePreset

## @evidence contracts/development/common.md#meaningful-documentation

States what the preset fixes, how it is applied and where its members' meanings are.

## @evidence contracts/development/design.md#principled-representation

The technique is required and typed by the close strike's own named union; `arm` is fixed by the elbows and left to the close strike's default by the headbutt, which has no arm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This family owns the preset shape; `AutoMovieMotionHumanStrike.HORIZONTAL_ELBOW`, `RISING_ELBOW`, `DESCENDING_ELBOW`, `SPINNING_ELBOW`, `SPINNING_BACKFIST` and `HEADBUTT` are its data and the lexicon rows of the same names read them.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: the members are named once here instead of an inline pick of the close strike's parameters.

# src/motion/human/next/IAutoMovieMotionHumanStrike.ts#IAutoMovieMotionHumanStrike.IKickPreset

## @evidence contracts/development/common.md#meaningful-documentation

States what the preset fixes, how it is applied and where its members' meanings are.

## @evidence contracts/development/design.md#principled-representation

Two required members typed by the kick law's own named unions, so a preset always fixes exactly the technique and the leg.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This family owns the preset shape; `AutoMovieMotionHumanStrike.ROUND_KICK`, `SWITCH_KICK`, `PUSH_KICK` and `TEEP` are its data and the lexicon rows of the same names read them.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: the members are named once here instead of an inline pick of the kick's parameters.

# src/motion/human/next/IAutoMovieMotionHumanStrike.ts#IAutoMovieMotionHumanStrike.IKneePreset

## @evidence contracts/development/common.md#meaningful-documentation

States what the preset fixes, how it is applied and where its member's meaning is.

## @evidence contracts/development/design.md#principled-representation

One required member typed by the knee law's own named union, so a preset always fixes exactly the leg.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This family owns the preset shape; `AutoMovieMotionHumanStrike.LEAD_KNEE` and `REAR_KNEE` are its data and the lexicon rows of the same names read them.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: the member is named once here instead of an inline pick of the knee's parameters.

# src/motion/human/next/IAutoMovieMotionHumanStrike.ts#IAutoMovieMotionHumanStrike.IPunchRow

## @evidence contracts/development/common.md#meaningful-documentation

Names the parameters a punch row takes and the two it fixes.

## @evidence contracts/development/design.md#principled-representation

The punch's own parameters less exactly the members of `IPunchPreset`, so a row cannot be given what its preset fixes.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanPunch.IParams` owns the shape; the lexicon's strike map names the rows' parameters by this alias.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: one named projection instead of an inline `Omit` in every row.

# src/motion/human/next/IAutoMovieMotionHumanStrike.ts#IAutoMovieMotionHumanStrike.IFootStrikeRow

## @evidence contracts/development/common.md#meaningful-documentation

Names the parameters a foot-strike row takes and the four it fixes.

## @evidence contracts/development/design.md#principled-representation

The foot strike's own parameters less exactly the members of `IFootStrikePreset`, so a row cannot be given what its preset fixes.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanFootStrike.IParams` owns the shape; the lexicon's strike map names the rows' parameters by this alias.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: one named projection instead of an inline `Omit` in every row.

# src/motion/human/next/IAutoMovieMotionHumanStrike.ts#IAutoMovieMotionHumanStrike.ICloseStrikeRow

## @evidence contracts/development/common.md#meaningful-documentation

Names the parameters a close-strike row takes and the two it fixes.

## @evidence contracts/development/design.md#principled-representation

The close strike's own parameters less exactly the members of `ICloseStrikePreset`, so a row cannot be given what its preset fixes.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanCloseStrike.IParams` owns the shape; the lexicon's strike map names the rows' parameters by this alias.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: one named projection instead of an inline `Omit` in every row.

# src/motion/human/next/IAutoMovieMotionHumanStrike.ts#IAutoMovieMotionHumanStrike.IKickRow

## @evidence contracts/development/common.md#meaningful-documentation

Names the parameters a kick row takes and the two it fixes.

## @evidence contracts/development/design.md#principled-representation

The kick's own parameters less exactly the members of `IKickPreset`, so a row cannot be given what its preset fixes.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanKick.IParams` owns the shape; the lexicon's strike map names the rows' parameters by this alias.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: one named projection instead of an inline `Omit` in every row.

# src/motion/human/next/IAutoMovieMotionHumanStrike.ts#IAutoMovieMotionHumanStrike.IKneeRow

## @evidence contracts/development/common.md#meaningful-documentation

Names the parameters a knee row takes and the one it fixes.

## @evidence contracts/development/design.md#principled-representation

The knee's own parameters less exactly the member of `IKneePreset`, so a row cannot be given what its preset fixes.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanKnee.IParams` owns the shape; the lexicon's strike map names the rows' parameters by this alias.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: one named projection instead of an inline `Omit` in every row.
