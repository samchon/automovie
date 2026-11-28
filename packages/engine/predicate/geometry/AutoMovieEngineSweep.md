# src/geometry/AutoMovieEngineSweep.ts#AutoMovieEngineSweep.locateSurfaceCoordinate

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc gives the normalized input, deterministic grid and transition ownership, endpoint rule, verified inverse and quad result.

## @evidence contracts/development/implementation.md#principled-implementation

The grid checks its declared cardinality and the chosen face's four finite same-patch corners. For explicit faces a bounded footprint rejects outside candidates. The affine Jacobian determinant must have one sign on the square. Tiny ranges solve in scaled chart axes; a regular solved address must pass a forward residual check after clipping to the unit square.

## @evidence contracts/development/implementation.md#efficient-algorithms

The regular route reads one slot and four corners. The transition visits candidates in declared order, skips out-of-footprint faces before solving, and uses at most 30 Newton steps per remaining face.

# src/geometry/AutoMovieEngineSweep.ts#AutoMovieEngineSweep.locateSurfaceVertices

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc defines the matched layout, dense vertex-order contract, finite quad sampling and optional sweep-domain result.

## @evidence contracts/development/implementation.md#principled-implementation

Each parameter slot is read, including holes. The shared reader verifies an addressed quad with normalized finite corners belonging to a single patch. Bilinear weights stay within that patch, and a sweep uses t along u and s along v. A nonfinite published sweep address refuses.

## @evidence contracts/development/implementation.md#efficient-algorithms

The owner validates matching patch names once and processes one four-corner chart per vertex. It reads no posed positions and returns one new location per admitted address.

# src/geometry/AutoMovieEngineSweep.ts#AutoMovieEngineSweep.layoutSurfacePatches

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc states grid and explicit shapes, independent seam UV identity, preflight atomicity, empty patches and the final edge check.

## @evidence contracts/development/implementation.md#principled-implementation

The writer admits addressed grid or quad slots and finite normalized chart values before changing any buffer. UV interpolation preserves directed endpoints and uses a finite convex combination if ordinary arithmetic exceeds range. The wrapped slot selects the original geometry ordinal while the UV grid has its separate final column. Explicit chart corners share UVs by their exact patch coordinate key.

## @evidence contracts/development/implementation.md#efficient-algorithms

Preflight reads each addressed input slot once without duplicating its buffer. Emission appends rows in order, interns explicit UV coordinates and retains only output buffers. The final directed-edge check scans the generated faces.
