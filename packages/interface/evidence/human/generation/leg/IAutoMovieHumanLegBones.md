# src/human/generation/leg/IAutoMovieHumanLegBones.ts#IAutoMovieHumanLegBones.IBones

## @evidence contracts/development/common.md#meaningful-documentation

The three joint centres of the left leg and the bones' lengths.

## @evidence contracts/development/design.md#principled-representation `hip`: Hip joint centre. `knee`: Knee joint centre. `ankle`: Ankle joint centre, at the lateral malleolus.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanLegBones.of. Read by AutoMovieHumanLegWalk.define, AutoMovieHumanLegWalk.create, AutoMovieHumanLegWalk.source.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `hip`, `knee`, `ankle`, `femur`, `tibia`; callers supply the complete record.

# src/human/generation/leg/IAutoMovieHumanLegBones.ts#IAutoMovieHumanLegBones.IInput

## @evidence contracts/development/common.md#meaningful-documentation

What the bones are placed from.

## @evidence contracts/development/design.md#principled-representation `stature`: Stature, calibration mm. `scale`: Calibration millimetres per world millimetre; the published constants below are world millimetres. `ankleHeight`: Lateral malleolus height, calibration mm: the foot's `ankleHeight` input.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanLegBones.of.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `stature`, `scale`, `ankleHeight`, `medial`, `hipForward`, `ankleForward`; callers supply the complete record.
