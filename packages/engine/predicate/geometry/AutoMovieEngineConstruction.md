# src/geometry/AutoMovieEngineConstruction.ts#AutoMovieEngineConstruction.orientSolidChart

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc gives the ordering of the three points, the common frame and units, the winding convention, the exact zero decision and the refusal of nonfinite coordinates.

## @evidence contracts/development/implementation.md#principled-implementation

The owner reads and checks all six coordinates before any arithmetic shortcut. On an axis-aligned edge, the orders of the other coordinates determine the sign of the single surviving determinant product. Other inputs use a rounding-error bound on normal differences and products. If that bound cannot establish the sign, the decoder puts each finite represented coordinate on a common power-of-two grid. Scaling every coordinate by the same positive factor preserves the determinant sign, so the integer cross product settles subnormal, overflowed and cancelling cases without a geometric tolerance.

## @evidence contracts/development/implementation.md#efficient-algorithms

The normal path uses six scalar reads and fixed arithmetic. It allocates the six entries of the dyadic grid only when the axis and rounding tests leave the sign unresolved. The shared decoder has an eight-byte synchronous scratch cell. The call returns a number and releases its temporary arrays.

# src/geometry/AutoMovieEngineConstruction.ts#AutoMovieEngineConstruction.incircleSolidChart

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc describes the four point roles, the required common chart, the effect of winding, the collinear case and the nonfinite-input failure.

## @evidence contracts/development/implementation.md#principled-implementation

The query point is the translated origin. The determinant lifts each remaining point by its squared distance, which gives the oriented circle test. The bounded floating filter applies with nonzero differences between two to the powers −200 and 200, keeping fourth-order products inside the normal binary64 range. Results inside the error bound use the exact determinant on a common integer grid. That grid scales all fourth-order terms by the same positive factor. Nonfinite coordinates refuse before either path.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass reads and admits the eight input coordinates. The floating filter reuses their differences in the three lifts. Only an uncertain case decodes the same eight numbers and builds the three integer lifts. Temporary data belongs to the call, and the shared cell holds eight bytes.

# src/geometry/AutoMovieEngineConstruction.ts#AutoMovieEngineConstruction.sampleConstructionCurves

## @evidence contracts/development/common.md#meaningful-documentation

Identifies sampling counts and defaults, curve order, millimetre-to-metre conversion, and numeric or missing-owner refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Both counts are admitted before looking up any realized curve. Safe integer counters describe discrete phase positions and station subdivisions. The divisibility rule puts each guide on a phase already sampled in the corresponding ring. The original surface owns all samples.

## @evidence contracts/development/implementation.md#efficient-algorithms

One map indexes surfaces by owner name and one set stores blamed names. A station's ring supplies its section, guide positions and centroid, avoiding repeated original point reads. Buffers and lookup tables belong to the call.
