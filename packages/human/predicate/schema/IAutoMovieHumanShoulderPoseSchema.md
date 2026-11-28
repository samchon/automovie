# src/schema/IAutoMovieHumanShoulderPoseSchema.ts#IAutoMovieHumanShoulderPoseSchema

## @evidence contracts/development/common.md#meaningful-documentation

The description gives the three named upper-arm axes and their individual positive directions. Extension, adduction and internal rotation use negative values.

## @evidence contracts/development/design.md#principled-representation

Typia bounds flexion to [-60, 170.4] degrees, abduction to [-40, 180] and rotation to [-70, 90]. The Human table applies the three requests to upper-arm flexion, abduction and twist. Rig projection owns its neutral-frame scaling.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The arm pose pairs this optional record with the separate girdle, elbow and distal joint records. The basic limits belong to the three authored scalars.
