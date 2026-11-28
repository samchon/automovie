# src/geometry/IAutoMovieContourLoftSink64.ts#IAutoMovieContourLoftSink64

## @evidence contracts/development/common.md#meaningful-documentation

The interface explains synchronous delivery, storage and capacity responsibility, and exception propagation.

## @evidence contracts/development/design.md#principled-representation

The generator assigns indices by source identity and delivers each vertex before a referencing triangle. It synchronously delivers construction after face work. Any callback failure aborts without converting the exception into an unresolved contour record.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Output ownership is supplied by the caller. The generator carries topology, coordinates and qualification, while the sink selects storage and lifecycle.

# src/geometry/IAutoMovieContourLoftSink64.ts#IAutoMovieContourLoftSink64.vertex

## @evidence contracts/development/common.md#meaningful-documentation

The callback receives the assigned output index and its borrowed millimetre point before any reference to that vertex.

# src/geometry/IAutoMovieContourLoftSink64.ts#IAutoMovieContourLoftSink64.triangle

## @evidence contracts/development/common.md#meaningful-documentation

The callback receives three existing indices in the generator's face and corner order.

# src/geometry/IAutoMovieContourLoftSink64.ts#IAutoMovieContourLoftSink64.construction

## @evidence contracts/development/common.md#meaningful-documentation

The callback borrows one generating ring and its phase reader. Pass the original supplied point object to obtain its phase during delivery.
