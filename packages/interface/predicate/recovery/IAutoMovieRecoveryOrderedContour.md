# src/recovery/IAutoMovieRecoveryOrderedContour.ts#IAutoMovieRecoveryOrderedContour

## @evidence contracts/development/common.md#meaningful-documentation

The record keeps physical positions, cut-edge parameters, measured cumulative polyline phase and original face ownership at point and segment boundaries.

## @evidence contracts/development/design.md#principled-representation

Segments follow consecutive original raw point positions, including the final-to-first edge only for a closed contour. Each carries the official cut occurrence and actual emitting source faces.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The recut owns raw observations and their polyline lengths. Any reconstructed fitted phase belongs to the explicit saved-cubic replay result.

# src/recovery/IAutoMovieRecoveryOrderedContour.ts#IAutoMovieRecoveryOrderedContour.contourIndex

## @evidence contracts/development/common.md#meaningful-documentation

The reobserver keys each new contour and its matching bound lineage by the cutter's original position.

# src/recovery/IAutoMovieRecoveryOrderedContour.ts#IAutoMovieRecoveryOrderedContour.closed

## @evidence contracts/development/common.md#meaningful-documentation

A closed contour expects one segment per point, including the seam from the last point to the first.

# src/recovery/IAutoMovieRecoveryOrderedContour.ts#IAutoMovieRecoveryOrderedContour.publication

## @evidence contracts/development/common.md#meaningful-documentation

The reobserver copies the binder's verified closure/publication record without replacing its referenced curve.

# src/recovery/IAutoMovieRecoveryOrderedContour.ts#IAutoMovieRecoveryOrderedContour.sourceTriangleIds

## @evidence contracts/development/common.md#meaningful-documentation

Local support faces are remapped through the caller-supplied native triangle map.

# src/recovery/IAutoMovieRecoveryOrderedContour.ts#IAutoMovieRecoveryOrderedContour.exactSourceTriangleIds

## @evidence contracts/development/common.md#meaningful-documentation

The bound fresh cut supplies exact-emitting faces, mapped to caller-declared native ordinals.

# src/recovery/IAutoMovieRecoveryOrderedContour.ts#IAutoMovieRecoveryOrderedContour.points

## @evidence contracts/development/common.md#meaningful-documentation

The observer copies point coordinates and each optional alternative source edge before publishing the contour.

# src/recovery/IAutoMovieRecoveryOrderedContour.ts#IAutoMovieRecoveryOrderedContour.cumulativePolylineMm

## @evidence contracts/development/common.md#meaningful-documentation

The observer accumulates Euclidean segment lengths in raw order, leaving the closing seam to the total/last segment.

# src/recovery/IAutoMovieRecoveryOrderedContour.ts#IAutoMovieRecoveryOrderedContour.totalPolylineMm

## @evidence contracts/development/common.md#meaningful-documentation

The result uses the last segment's endpoint coordinate, or zero for no segments.

# src/recovery/IAutoMovieRecoveryOrderedContour.ts#IAutoMovieRecoveryOrderedContour.segments

## @evidence contracts/development/common.md#meaningful-documentation

Actual cutter occurrence count must match raw point connectivity before segment records are published.
