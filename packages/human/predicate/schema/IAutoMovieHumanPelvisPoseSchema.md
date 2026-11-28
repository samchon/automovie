# src/schema/IAutoMovieHumanPelvisPoseSchema.ts#IAutoMovieHumanPelvisPoseSchema

## @evidence contracts/development/common.md#meaningful-documentation

The three fields identify sagittal, frontal and transverse motion from the body's anatomical frame.

## @evidence contracts/development/design.md#principled-representation

Typia bounds tilt and obliquity to [-90, 90] degrees and rotation to [-180, 180]. Human maps those requests to flexion, abduction and twist on the hips joint.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The pose has one pelvis block for these angles. Pelvic translation and any hip-dependent contribution are determined by other inputs or evaluation.
