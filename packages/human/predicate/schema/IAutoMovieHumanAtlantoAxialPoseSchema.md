# src/schema/IAutoMovieHumanAtlantoAxialPoseSchema.ts#IAutoMovieHumanAtlantoAxialPoseSchema

## @evidence contracts/development/common.md#meaningful-documentation

The declaration specifies the joint, both directions relative to the person's body and the angular unit.

## @evidence contracts/development/design.md#principled-representation

The optional scalar admits [-40, 40] degrees. The Human channel table maps it to the atlas twist axis with the existing positive sign.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The neck schema uses this one value for atlas rotation. Lower cervical rotation retains its own channel and range.
