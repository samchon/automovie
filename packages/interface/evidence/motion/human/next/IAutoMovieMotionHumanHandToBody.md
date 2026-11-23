# src/motion/human/next/IAutoMovieMotionHumanHandToBody.ts#IAutoMovieMotionHumanHandToBody

## @evidence contracts/development/common.md#meaningful-documentation

States the family's shared model and what its methods have in common.

## @evidence contracts/development/design.md#principled-representation

One method per law of the HandToBody family, each taking the law's own parameter type.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The HandToBody laws and nothing the other families own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each method takes the existing parameter type of its law; nothing is redefined.

# src/motion/human/next/IAutoMovieMotionHumanHandToBody.ts#IAutoMovieMotionHumanHandToBody.Hold

## @evidence contracts/development/common.md#meaningful-documentation

Names the unit and the two forms.

## @evidence contracts/development/design.md#principled-representation

The same two forms `IAutoMovieMotionHumanHandToFace.IParams.hold` takes, named once for the rows that pass it on.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `IWipeTears` only.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: no form is added to the law's own.

# src/motion/human/next/IAutoMovieMotionHumanHandToBody.ts#IAutoMovieMotionHumanHandToBody.IHoldBetween

## @evidence contracts/development/common.md#meaningful-documentation

Names the unit of the bounds.

## @evidence contracts/development/design.md#principled-representation

The lower and the upper bound of one draw.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One member, as the law's own hold states it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: the bounds are not checked here; the law refuses a bad hold.

# src/motion/human/next/IAutoMovieMotionHumanHandToBody.ts#IAutoMovieMotionHumanHandToBody.ICoverFace

## @evidence contracts/development/common.md#meaningful-documentation

States each member, its unit and its default.

## @evidence contracts/development/design.md#principled-representation

The two members of the hand-to-face law the cover leaves open; the hand, the count, the cheeks and the head's bow are `COVER_FACE`'s.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Fixes the gesture and exposes only the hold and the manner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: both members are optional as the law's own are.

# src/motion/human/next/IAutoMovieMotionHumanHandToBody.ts#IAutoMovieMotionHumanHandToBody.IWipeTears

## @evidence contracts/development/common.md#meaningful-documentation

States each member, its unit and its default.

## @evidence contracts/development/design.md#principled-representation

The members of the hand-to-face law the wipe leaves open; the task and the second hand are `WIPE_TEARS`'s.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Fixes the task and excludes a second hand while inheriting the timing, one-hand controls and cuts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: every member is optional as the law's own are.

# src/motion/human/next/IAutoMovieMotionHumanHandToBody.ts#IAutoMovieMotionHumanHandToBody.Hands

## @evidence contracts/development/common.md#meaningful-documentation

Names the two forms.

## @evidence contracts/development/design.md#principled-representation

The arm phrase's own hand choice, named once.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `ITuckHair` only.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: no form is added to the phrase's own.

# src/motion/human/next/IAutoMovieMotionHumanHandToBody.ts#IAutoMovieMotionHumanHandToBody.ITuckHair

## @evidence contracts/development/common.md#meaningful-documentation

States what the caller selects and the omitted defaults.

## @evidence contracts/development/design.md#principled-representation

The arm phrase's canonical hand and manner contracts, including their optionality.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the hand and the manner vary.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: both members keep the phrase's own defaults, the right hand and the neutral manner.

# src/motion/human/next/IAutoMovieMotionHumanHandToBody.ts#IAutoMovieMotionHumanHandToBody.ICoverFacePreset

## @evidence contracts/development/common.md#meaningful-documentation

Names each fixed member and what it fixes.

## @evidence contracts/development/design.md#principled-representation

The law's own members, fixed as data so the row and a reader share one value.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Exactly the members the `coverFace` row fixes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: the row reads the constant instead of repeating its values.

# src/motion/human/next/IAutoMovieMotionHumanHandToBody.ts#IAutoMovieMotionHumanHandToBody.IWipeTearsPreset

## @evidence contracts/development/common.md#meaningful-documentation

Names each fixed member and what it fixes.

## @evidence contracts/development/design.md#principled-representation

The law's own members, fixed as data so the row and a reader share one value.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Exactly the members the `wipeTears` row fixes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: the row reads the constant instead of repeating its values.

# src/motion/human/next/IAutoMovieMotionHumanHandToBody.ts#IAutoMovieMotionHumanHandToBody.ITuckHairPreset

## @evidence contracts/development/common.md#meaningful-documentation

Names each fixed member, its unit and what it fixes.

## @evidence contracts/development/design.md#principled-representation

The arm phrase's own members, fixed as data so the row and a reader share one value; the offsets are shares of the arm's length.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Exactly the members the `tuckHair` row fixes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: the row reads the constant instead of repeating its values.
