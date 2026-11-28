# src/geometry/IAutoMovieCreateMeshDepthSampler.ts#IAutoMovieCreateMeshDepthSampler.IResult

## @evidence contracts/development/common.md#meaningful-documentation

The callable describes cyclic plane axes, mesh-local metres, synchronous query, copied index ownership, and null on an uncovered sample.

## @evidence contracts/development/design.md#principled-representation

The index copies finite positions, admits finite plane coordinates before cell lookup and refuses nonfinite interpolation. It compares axial depths of covering projected triangles, with equal depths possible on one sheet.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The callable borrows no inputs beyond its private copied index and returns one transient depth range.

# src/geometry/IAutoMovieCreateMeshDepthSampler.ts#IAutoMovieCreateMeshDepthSampler.IDepthRange

## @evidence contracts/development/common.md#meaningful-documentation

The range describes the covering triangle extrema in mesh-local metres and distinguishes equal depths from a miss.

## @evidence contracts/development/design.md#principled-representation

Both extrema use the same axial interpolation under projection, so a single covering face may give equal depths.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two scalars describe the requested envelope. They carry no triangle identity or volume interpretation.

# src/geometry/IAutoMovieCreateMeshDepthSampler.ts#IAutoMovieCreateMeshDepthSampler.IDepthRange.minimum

## @evidence contracts/development/common.md#meaningful-documentation

The value is the smallest axial depth in the shared metre frame among covering projected faces.

# src/geometry/IAutoMovieCreateMeshDepthSampler.ts#IAutoMovieCreateMeshDepthSampler.IDepthRange.maximum

## @evidence contracts/development/common.md#meaningful-documentation

The value is the greatest axial depth in the same frame. The difference from minimum gives the envelope span.
