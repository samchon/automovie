# src/schema/IAutoMovieHumanLumbarPoseSchema.ts#IAutoMovieHumanLumbarPoseSchema

## @evidence contracts/development/common.md#meaningful-documentation

The documentation distinguishes the forward flexion channel from each left-positive channel. All three use degrees.

## @evidence contracts/development/design.md#principled-representation

Typia bounds flexion to [-15, 50] degrees, lateral flexion to [-20, 20] and rotation to [-5, 5]. Human routes them to the spine joint's flexion, signed abduction and twist.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The spine schema owns this optional lumbar block. Thoracic motion and pelvis orientation have their own records.
