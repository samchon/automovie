# src/math/AutoMovieEngineVector3.ts#AutoMovieEngineVector3.isFinite

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc states the component-wise decision and the accepted and refused numeric classes.

## @evidence contracts/development/implementation.md#principled-implementation

The three Number.isFinite checks match the finite binary64 coordinate premise used by vector consumers. Each sign of infinity and NaN fails independently.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most three scalar checks are needed. The conjunction stops at the first nonfinite component.

# src/math/AutoMovieEngineVector3.ts#AutoMovieEngineVector3.create

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc identifies the component order, zero defaults and fresh mutable result.

## @evidence contracts/development/implementation.md#principled-implementation

The parameter defaults fill the three coordinates independently. The object literal assigns the resulting numeric values directly, including signed zero and nonfinite values.

## @evidence contracts/development/implementation.md#efficient-algorithms

One record stores three coordinates. The constructor performs no vector arithmetic or shared mutation.

# src/math/AutoMovieEngineVector3.ts#AutoMovieEngineVector3.add

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc states the coordinate-wise operation, common-frame premise and independent result.

## @evidence contracts/development/implementation.md#principled-implementation

Each coordinate is the sum of its two corresponding coordinates. The result uses ordinary scalar addition, so it inherits its rounding and overflow.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three sums and one result record suffice, with no intermediate vector.

# src/math/AutoMovieEngineVector3.ts#AutoMovieEngineVector3.subtract

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc gives the operand direction and common-frame premise, and states result ownership.

## @evidence contracts/development/implementation.md#principled-implementation

Subtracting each second coordinate from the matching first coordinate constructs the displacement. Negating the edge order reverses its mathematical direction, subject to binary64 arithmetic.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three differences are written directly into one result record.

# src/math/AutoMovieEngineVector3.ts#AutoMovieEngineVector3.scale

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc identifies the component-wise product, result ownership and numeric behavior.

## @evidence contracts/development/implementation.md#principled-implementation

Applying the same scalar to each coordinate preserves the geometric line through the origin. Zero collapses a finite vector, and a negative scalar reverses its orientation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three products populate one new vector without an intermediate.

# src/math/AutoMovieEngineVector3.ts#AutoMovieEngineVector3.addScaled

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc states the base and offset roles, units, multiplication order and fresh result.

## @evidence contracts/development/implementation.md#principled-implementation

The direction's three products are computed before reading the base for the three sums. Keeping the product/add grouping preserves signed zero, rounding and nonfinite propagation of the composed operations.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three products are stored in scalar locals, then three sums form the result. No offset record is allocated.

# src/math/AutoMovieEngineVector3.ts#AutoMovieEngineVector3.dot

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc names the coordinate rule and when the result represents an angular cosine.

## @evidence contracts/development/implementation.md#principled-implementation

The three component products summed in X/Y/Z order implement the Euclidean inner product. A nonunit pair retains its magnitudes and binary64 product and sum bounds.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three products and two additions produce one scalar without allocating a vector.

# src/math/AutoMovieEngineVector3.ts#AutoMovieEngineVector3.cross

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc names order, orientation and output ownership.

## @evidence contracts/development/implementation.md#principled-implementation

The three signed coordinate minors are the determinant expansion of the right-handed cross product. It is perpendicular to both operands in exact arithmetic, and parallel directions yield zero in that arithmetic.

## @evidence contracts/development/implementation.md#efficient-algorithms

Six products and three differences feed one result, without constructing a matrix.

# src/math/AutoMovieEngineVector3.ts#AutoMovieEngineVector3.crossDifferenceInto

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc identifies the two authored edges and their order, and states the target ownership and supported aliasing.

## @evidence contracts/development/implementation.md#principled-implementation

Scalar endpoint differences form the two edges. The three cross-product coordinates are computed before target mutation, so any permitted input alias yields the same coordinates.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two differences and one cross use only scalar locals and mutate the existing three coordinates. The operation allocates no edge or result object.

# src/math/AutoMovieEngineVector3.ts#AutoMovieEngineVector3.length

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc identifies the norm and unit, ordinary calculation, extreme-magnitude handling and representability limit.

## @evidence contracts/development/implementation.md#principled-implementation

The largest component selects the square-and-sum path across 2^-511 through 2^511. Its square stays normal in that interval and three such squares fit in binary64. Outside the interval the hypot path preserves representable small or large lengths.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three coordinate magnitudes select one fixed-size norm calculation. Both paths use scalar work without a new record.

# src/math/AutoMovieEngineVector3.ts#AutoMovieEngineVector3.distance

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc names the position premise, unit, equivalent displacement norm and range limit.

## @evidence contracts/development/implementation.md#principled-implementation

The coordinate differences define the displacement. An ordinary finite squared norm uses its square root; near the numeric range boundaries the same extreme-magnitude gate as length selects hypot when needed.

## @evidence contracts/development/implementation.md#efficient-algorithms

Differences are kept in scalars, avoiding a displacement record. The ordinary squared-norm path returns before inspecting the largest component.

# src/math/AutoMovieEngineVector3.ts#AutoMovieEngineVector3.normalize

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc names result orientation, zero convention, finite extreme handling and the caller's admission premise.

## @evidence contracts/development/implementation.md#principled-implementation

Scaling by a positive largest component preserves direction. It brings at least one magnitude to one before unit scaling. The shared norm gate keeps ordinary-range arithmetic unchanged and the zero norm takes the explicit zero result.

## @evidence contracts/development/implementation.md#efficient-algorithms

Ordinary values reuse their input record read-only and create only the result. Extreme values create one temporary scaled vector. Each norm and scaling operation touches three components.

# src/math/AutoMovieEngineVector3.ts#AutoMovieEngineVector3.normalizeTuple

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc names tuple order and ownership, zero behavior and the shared extreme-magnitude semantics.

## @evidence contracts/development/implementation.md#principled-implementation

The tuple components are passed without reordering to the record normalizer, which chooses the norm and extreme scaling. The resulting record becomes an X/Y/Z tuple.

## @evidence contracts/development/implementation.md#efficient-algorithms

The adapter converts one three-component tuple to a record and converts the normalized result back. It performs one normalization and keeps no state.

# src/math/AutoMovieEngineVector3.ts#AutoMovieEngineVector3.lerp

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc states the interpolation formula, extrapolation domain and difference range limit.

## @evidence contracts/development/implementation.md#principled-implementation

Each coordinate follows the affine line from the first endpoint to the second. The factor is multiplied after the endpoint difference, preserving the concrete rounding and overflow behavior of that expression.

## @evidence contracts/development/implementation.md#efficient-algorithms

The fixed three coordinates each use a difference, product and sum. They are written directly to one fresh vector.

# src/math/AutoMovieEngineVector3.ts#AutoMovieEngineVector3.prepareLerp

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc names the snapshot, common-frame premise, fresh result and extrapolation.

## @evidence contracts/development/implementation.md#principled-implementation

Preparing the evaluation captures a start coordinate and the original endpoint difference in the same per-coordinate read order as lerp. Subsequent calls apply the same product and sum grouping, with the same numeric limits.

## @evidence contracts/development/implementation.md#efficient-algorithms

Preparation caches six scalars and retains no endpoint reference. Each sample computes three products and sums and allocates one result, without recomputing differences.
