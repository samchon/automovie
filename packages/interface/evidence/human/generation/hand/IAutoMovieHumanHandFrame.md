# src/human/generation/hand/IAutoMovieHumanHandFrame.ts#IAutoMovieHumanHandFrame

## @evidence contracts/development/common.md#meaningful-documentation

The hand's frame on its knuckles.

## @evidence contracts/development/design.md#principled-representation `along`: Wrist centre to knuckle III. `across`: Knuckle V toward II, square to `along`. `palmar`: Toward the palm, square to both.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanHandJoints.frameOf. Read by AutoMovieHumanFingerBones.of, AutoMovieHumanHandJoints.proximal. Also types AutoMovieHumanHandBones.frame, AutoMovieHumanThumbBones.frame.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `along`, `across`, `palmar`; callers supply the complete record.
