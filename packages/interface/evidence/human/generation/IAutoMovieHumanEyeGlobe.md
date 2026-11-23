# src/human/generation/IAutoMovieHumanEyeGlobe.ts#IAutoMovieHumanEyeGlobe

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the AutoMovieHumanEyeGlobe exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.

## @evidence contracts/development/design.md#principled-representation

A type-only namespace groups IDerived, IDimensions. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these declarations used by Human's AutoMovieHumanEyeGlobe; Human retains the computation and source preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace only qualifies the IDerived, IDimensions contracts and adds no alternate implementation, optional mode or runtime state.

# src/human/generation/IAutoMovieHumanEyeGlobe.ts#IAutoMovieHumanEyeGlobe.IDerived

## @evidence contracts/development/common.md#meaningful-documentation

Quantities derived from {@link dimensions}, millimetres along the gaze axis from the globe centre.

## @evidence contracts/development/design.md#principled-representation `axial`: Axial semi-axis of the scleral ellipsoid. `limbus`: Limbus plane position. `cornealCentre`: Corneal sphere centre position.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanEyeGlobe.derive. Also types AutoMovieHumanEyeGlobe.g.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `axial`, `limbus`, `cornealCentre`, `apex`, `pupil`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanEyeGlobe.ts#IAutoMovieHumanEyeGlobe.IDimensions

## @evidence contracts/development/common.md#meaningful-documentation

Biometric means in millimetres, with their basis.

## @evidence contracts/development/design.md#principled-representation `radial`: Scleral radial semi-axis, millimetres. `axialLength`: Corneal apex to posterior pole, millimetres. `cornealRadius`: Anterior corneal curvature radius, millimetres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanEyeGlobe.IDimensions is the canonical exchange used by AutoMovieHumanEyeGlobe.dimensions.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `radial`, `axialLength`, `cornealRadius`, `limbusRadius`, `anteriorChamberDepth`, `pupilRadius`, `irisRecession`; callers supply the complete record.
