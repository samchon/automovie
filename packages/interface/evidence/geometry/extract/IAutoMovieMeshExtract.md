# src/geometry/extract/IAutoMovieMeshExtract.ts#IAutoMovieMeshExtract.IExtreme

## @evidence contracts/development/design.md#principled-representation

The support point of the section polygon, which is always one of its vertices.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The point and its reach, nothing derived further.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reports the cut's own vertex; no smoothing.

## @evidence contracts/development/common.md#meaningful-documentation

States what the reach is measured from.

# src/geometry/extract/IAutoMovieMeshExtract.ts#IAutoMovieMeshExtract.IReduceResult

## @evidence contracts/development/design.md#principled-representation

Sections use the supplied mesh frame in millimetres; scalar runs keep their supplied station and value units, and loop tangents differentiate chord length.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieMeshExtract produces these records; AutoMovieMeshCourse and profileCurve consume section loops and fitted knots.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Mesh indexing, finite samples and orthonormal frames are caller premises; outline flags broken cuts, reducers check minimum sample counts, and profileCurve checks station order and loop size.

## @evidence contracts/development/common.md#meaningful-documentation

Mesh slicing and Hermite reduction records used to author construction profiles. Sections use the supplied mesh frame in millimetres; scalar runs keep their supplied station and value units, and loop tangents differentiate chord length.

# src/geometry/extract/IAutoMovieMeshExtract.ts#IAutoMovieMeshExtract.IReduceLoopResult

## @evidence contracts/development/design.md#principled-representation

Sections use the supplied mesh frame in millimetres; scalar runs keep their supplied station and value units, and loop tangents differentiate chord length.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieMeshExtract produces these records; AutoMovieMeshCourse and profileCurve consume section loops and fitted knots.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Mesh indexing, finite samples and orthonormal frames are caller premises; outline flags broken cuts, reducers check minimum sample counts, and profileCurve checks station order and loop size.

## @evidence contracts/development/common.md#meaningful-documentation

Mesh slicing and Hermite reduction records used to author construction profiles. Sections use the supplied mesh frame in millimetres; scalar runs keep their supplied station and value units, and loop tangents differentiate chord length.
