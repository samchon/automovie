# src/geometry/construction/AutoMovieConstructionSplitRibbon.ts#Ribbon

## @evidence contracts/development/common.md#meaningful-documentation

Defines one angular displacement reader by its normalized longitudinal course.

## @evidence contracts/development/design.md#principled-representation

The two successive parameters are normalized within one generating sector. The result is a displacement in world millimetres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The station parameter binds the transverse endpoint observations once for the requested row.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The same signature serves all sectors. The generating curves and endpoints determine its values.

# src/geometry/construction/AutoMovieConstructionSplitRibbon.ts#readAngularEndpoint

## @evidence contracts/development/common.md#meaningful-documentation

Estimates the angular derivative of a generating curve at one sector endpoint.

## @evidence contracts/development/implementation.md#principled-implementation

Uses a second-order one-sided stencil inside the same source sector. The numerical step derives from the balance of double-precision rounding and truncation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One derivative calculation returns four control differences so subsequent evaluations can use the same cubic basis.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The operator estimates the derivative from one bounded source and documents the stencil. It preserves the endpoint values in the underlying curves.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reads three complete cubic control sets per endpoint request, irrespective of later samples on that endpoint.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The output angular control net is shared along one original side when its caller prepares the shared tangent plane.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns four vectors scoped to the current endpoint and source.

# src/geometry/construction/AutoMovieConstructionSplitRibbon.ts#prepareCoursePlane

## @evidence contracts/development/common.md#meaningful-documentation

Prepares the paired transverse corrections along one genuine shared generating line.

## @evidence contracts/development/implementation.md#principled-implementation

After removing their line tangents, two angular vectors meet at their unit bisector and keep their individual speeds. This uses Salvi, Vaitkus and Várady's direction, rate and shear separation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The original sides determine the measured plane correction once. The section reader applies it along the line.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Equal angle motion is an explicit estimate. At each longitudinal end the correction vanishes so the original source jet supplies the boundary.

## @evidence contracts/development/implementation.md#efficient-algorithms

Prepares two endpoint angular control nets once. Each subsequent query evaluates those cubics and projects two vectors.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The branches read the same shared course and endpoint derivative data.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned line closure captures two derivative control nets and one shared line for its callers only.

# src/geometry/construction/AutoMovieConstructionSplitRibbon.ts#prepareCourseRibbon

## @evidence contracts/development/common.md#meaningful-documentation

Extends two shared-line derivative corrections across their existing sector.

## @evidence contracts/development/implementation.md#principled-implementation

Uses a cubic Hermite endpoint derivative basis and Gregory corner factors to protect the original boundaries. The two-end weighting follows the original rectangular chart domain.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The extension binds measured corrections to one station, producing a direct scalar-weight reader over the angular sector.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Both edge positions and the two longitudinal edges are held by the basis. Reciprocal-distance corner weights have zero contribution at the protected longitudinal ends.

## @evidence contracts/development/implementation.md#efficient-algorithms

Prepares two incident line corrections per requested station. Each angular evaluation uses two weights and one vector sum.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The prepared row reads the same two line-owned derivative vectors across all its angular samples.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The row closure owns two vectors and its fixed coordinates within the enclosing chart evaluation.
