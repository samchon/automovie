# src/schema/IAutoMovieHumanThoracicPoseSchema.ts#IAutoMovieHumanThoracicPoseSchema

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states the anatomical origin, degree unit and the positive direction of each channel.

## @evidence contracts/development/design.md#principled-representation

Typia bounds flexion to [-10, 30] degrees, lateral flexion to [-15, 15] and rotation to [-40, 40]. Human routes them to the chest joint's flexion, signed abduction and twist axes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The spine schema uses this optional block for thoracic motion. The lumbar region owns its different limits.
