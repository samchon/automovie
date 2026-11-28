# src/schema/IAutoMovieHumanHipPoseSchema.ts#IAutoMovieHumanHipPoseSchema

## @evidence contracts/development/common.md#meaningful-documentation

The documentation separates the sagittal, frontal and rotational controls and their anatomical signs.

## @evidence contracts/development/design.md#principled-representation

Typia bounds flexion to [-17.75, 132.1] degrees, abduction to [-20, 40] and rotation to [-45, 45]. Human maps those requests to the upper-leg joint. Pelvis sharing belongs to kinematic evaluation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The leg schema owns this optional hip record. Pelvis orientation and individual knee and foot controls keep their separate fields.
