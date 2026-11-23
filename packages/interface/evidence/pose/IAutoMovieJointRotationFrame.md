# src/pose/IAutoMovieJointRotationFrame.ts#IAutoMovieJointRotationFrame

## @evidence contracts/development/common.md#meaningful-documentation

States that the axes are the joint's clinical basis and that the rest frame lifts its angles, and that an absent frame leaves angles rest-relative.

## @evidence contracts/development/design.md#principled-representation

Canonical clinical axes and an optional canonical rest frame map rig rotation to clinical degrees; an absent frame leaves angles rest-relative.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members, both read by every function here; the radius table is cached on them; `of` gives them for a rig's bone.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No joint or bone is named, and no type is duplicated.
