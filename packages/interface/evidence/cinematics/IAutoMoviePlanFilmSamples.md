# src/cinematics/IAutoMoviePlanFilmSamples.ts#IAutoMoviePlanFilmSamples.IProps

## @evidence contracts/development/common.md#meaningful-documentation

States the second, the frame rate's unit and range, the admitted-optics premise and the field of view's unit and range.

## @evidence contracts/development/design.md#principled-representation

Every value a sample depends on, and nothing else, so the plan is a fixed function of the frame and never of an earlier one.

## @evidence contracts/development/design.md#minimal-and-owned-surface

All four fields are read: the second and rate for the shutter, the optics for the counts and lens, the field of view for the aperture.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None present.

# src/cinematics/IAutoMoviePlanFilmSamples.ts#IAutoMoviePlanFilmSamples.ISample

## @evidence contracts/development/common.md#meaningful-documentation

States each field's unit and frame and when the lens fields are null.

## @evidence contracts/development/design.md#principled-representation

The placement second and the eye offset in metres on the camera's right and up axes; the Hammersley index is carried so the decorrelating permutation is observable.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The host reads `seconds` and `eye`; `point` is read by the permutation check the issue requires and by a reader auditing a frame's lens order.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

`point` and `eye` are null together, without a lens; one nullable pair rather than a union keeps every sample one shape in the drawing loop.
