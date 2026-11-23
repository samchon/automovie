# src/human/generation/IAutoMovieHumanShoulderJoint.ts#IAutoMovieHumanShoulderJoint.IPlacement

## @evidence contracts/development/common.md#meaningful-documentation

A right-handed canonical-right frame, reflected only after placement.

## @evidence contracts/development/design.md#principled-representation `centre`: Generated joint centre in the caller's sided calibration frame. `axes`: Canonical-right AP, superior and medial axes; not measured AcrCS. `projection`: Acromion-to-GH projection along the straight downward measuring axis.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanShoulderJoint.of.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `centre`, `axes`, `projection`; callers supply the complete record.
