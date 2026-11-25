# src/lexicon/HumanCarriedGrip.ts#HumanCarriedGrip

## @evidence contracts/development/common.md#meaningful-documentation

Accepts an anchor-local grip and a planted carrier posture; returns only the chosen anchor-local tangent.

## @evidence contracts/development/implementation.md#principled-implementation

A palm contact fixes a point and opposing normal while leaving a rotation about that normal. The actual bounded arm and articulated fingers decide whether a candidate clears the partner.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Place the key, measure its original grip, and search its free tangent only for an obstructed hand.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every candidate uses the produced body's actual wrist range, hand shape and carried colliders.

## @evidence contracts/development/implementation.md#efficient-algorithms

A clear hand needs one solve. Further candidates share fixed key geometry; angular resolution follows from the finger displacement at the measured hand radius and contact skin.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the same contact, hand frame, external obstructions and anatomical arm solver as playback.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

All candidate bones and distance readers die with the call. The output contains only a tangent vector.
