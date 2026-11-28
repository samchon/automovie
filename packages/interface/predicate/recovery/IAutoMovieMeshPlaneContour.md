# src/recovery/IAutoMovieMeshPlaneContour.ts#IAutoMovieMeshPlaneContour

## @evidence contracts/development/common.md#meaningful-documentation

The contour retains its closure, original cut points and optional exact emitting face and ordered segment provenance.

## @evidence contracts/development/design.md#principled-representation

Source graph edges decompose into maximal degree-two chains or closed cycles. Branch endpoints and isolated contacts remain separate observations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The slicer owns raw observation and source incidence. Curve fitting and winding interpretation consume these points at later boundaries.

# src/recovery/IAutoMovieMeshPlaneContour.ts#IAutoMovieMeshPlaneContour.closed

## @evidence contracts/development/common.md#meaningful-documentation

The cutter marks cycle output separately from open branches and isolated point contacts.

# src/recovery/IAutoMovieMeshPlaneContour.ts#IAutoMovieMeshPlaneContour.pts

## @evidence contracts/development/common.md#meaningful-documentation

Consecutive positions follow actual observed source edges, with the final-to-first seam implicit for closed contours.

# src/recovery/IAutoMovieMeshPlaneContour.ts#IAutoMovieMeshPlaneContour.exactSourceTriangleIds

## @evidence contracts/development/common.md#meaningful-documentation

The prepared cutter collects these original faces only when the chosen provenance mode is enabled.

# src/recovery/IAutoMovieMeshPlaneContour.ts#IAutoMovieMeshPlaneContour.orderedSegments

## @evidence contracts/development/common.md#meaningful-documentation

The ordered provenance mode retains cut occurrence IDs and sorted emitting faces for each traversed segment.
