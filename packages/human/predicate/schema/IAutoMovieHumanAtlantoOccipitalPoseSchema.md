# src/schema/IAutoMovieHumanAtlantoOccipitalPoseSchema.ts#IAutoMovieHumanAtlantoOccipitalPoseSchema

## @evidence contracts/development/common.md#meaningful-documentation

The source gives the signed sagittal nod and frontal tilt conventions in anatomical coordinates.

## @evidence contracts/development/design.md#principled-representation

Typia bounds flexion to [-15, 10] degrees and lateral flexion to [-5, 5]. The Human channel table maps both to the head joint. The tilt row reverses the authored sign for its abduction axis.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The neck schema owns this optional two-channel block. Rotation around the atlas stays with the atlanto-axial record.
