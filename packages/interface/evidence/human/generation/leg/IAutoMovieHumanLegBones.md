# src/human/generation/leg/IAutoMovieHumanLegBones.ts#IAutoMovieHumanLegBones

## @evidence contracts/development/common.md#meaningful-documentation

Describes canonical-left leg joint centres, segment lengths and stature/ankle placement inputs; nested declarations retain their units, frames, optional states and callback contracts.

## @evidence contracts/development/design.md#principled-representation

Canonical-left leg joint centres, segment lengths and stature/ankle placement inputs. The optional pair requests the two centre-to-centre spans in calibration millimetres. The bone owner keeps the ankle support and resolves a straight neutral limb through both spans.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these dependency-free exchange types for AutoMovieHumanLegBones; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups the existing LegBones contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.

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
