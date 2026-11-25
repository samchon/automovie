# src/human/generation/IAutoMovieHumanBodyAnthropometry.ts#IAutoMovieHumanBodyAnthropometry.TapeControl

## @evidence contracts/development/common.md#meaningful-documentation

A body control whose unknown value takes its survey line on stature.

## @evidence contracts/development/design.md#principled-representation

A body control whose unknown value takes its survey line on stature. The closed alternatives are "chest", "underbust", "waist", "hip", "neckBase", "neck", "bustSpan", "neckToWaist", "shoulderToApex", "upperArmLength", "lowerArmLength", "bicep", "elbow", "forearm", "wrist", "handCircumference", "inseam", "thigh", "knee", "calf".

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanBodyAnatomy.TAPE_ON_STATURE, AutoMovieHumanBodyAnatomy.TAPE_FIELD.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanBodyAnatomy.tape, AutoMovieHumanBodyAnatomy.box, AutoMovieHumanBodyAnatomy.TAPE_ON_STATURE, AutoMovieHumanBodyAnatomy.TAPE_FIELD for a body control whose unknown value takes its survey line on stature.

# src/human/generation/IAutoMovieHumanBodyAnthropometry.ts#IAutoMovieHumanBodyAnthropometry.TapeField

## @evidence contracts/development/common.md#meaningful-documentation

An anatomy field that replaces a body control's tape or length.

## @evidence contracts/development/design.md#principled-representation

An anatomy field that replaces a body control's tape or length. The closed alternatives are "chestCircumference", "underbustCircumference", "waistCircumference", "hipCircumference", "neckBaseCircumference", "neckCircumference", "bustPointWidth", "backNeckToWaist", "sideNeckToBustPoint", "upperArmLength", "forearmLength", "upperArmCircumference", "elbowCircumference", "forearmCircumference", "wristCircumference", "handCircumference", "inseam", "thighCircumference", "kneeCircumference", "calfCircumference".

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanBodyAnatomy.TAPE_FIELD.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanBodyAnatomy.TAPE_FIELD for an anatomy field that replaces a body control's tape or length.
