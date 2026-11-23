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
