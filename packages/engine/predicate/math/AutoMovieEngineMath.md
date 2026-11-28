# src/math/AutoMovieEngineMath.ts#AutoMovieEngineMath.determinantMatrix3

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc specifies matrix order, dimensions and finite entries. It distinguishes the exact sign from approximate magnitude and documents zero and overflow or underflow refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The owner evaluates the six terms of the row-major determinant. Its floating filter uses a conservative error bound and falls back when a nonzero product underflows. The fallback decodes each contributing factor into its signed significand and exponent, aligns the six signed products and sums them exactly. Conversion preserves the sign and refuses when the nonzero magnitude cannot become a finite nonzero binary64 result.

## @evidence contracts/development/implementation.md#efficient-algorithms

The input has nine entries and the determinant has six terms. The common separated case avoids integer conversion. In the exact path, zero products are skipped and the shared decoder reuses one eight-byte cell. All other intermediate objects are local to the call.

# src/math/AutoMovieEngineMath.ts#AutoMovieEngineMath.fitRigidMeshTransform

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc gives the XYZ buffer layout, matching selection, finite selected data and centered application of the returned rigid fit. It describes input ownership, infeasible centring and deterministic ties.

## @evidence contracts/development/implementation.md#principled-implementation

Aligned buffer cardinality and distinct integer selection precede coordinate reads. Every selected coordinate must exist and be finite. Centering and positive scale normalization preserve the maximizing rotation while keeping the covariance's products representable. Horn's symmetric scalar-first quaternion eigenproblem yields the proper least-squares rotation. Fixed sweep order resolves ties deterministically, and the collapsed case uses identity.

## @evidence contracts/development/implementation.md#efficient-algorithms

The index set and the passes over the selected vertices scale with the selection. The covariance is 3 by 3 and its eigensolve is 4 by 4 with at most 24 sweeps. No buffers are copied into the result. The caller owns the returned fit records.

# src/math/AutoMovieEngineMath.ts#AutoMovieEngineMath.linearColorToSrgbHex

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc specifies finite linear RGB, finite gamut clamping, the six lowercase digits and the quantized inverse relationship.

## @evidence contracts/development/implementation.md#principled-implementation

Each channel is finite before clamping to [0, 1]. Its encoding uses the sRGB linear branch through 0.0031308 and the inverse power with exponent 1/2.4 above that boundary. Rounding the encoded channel to an eight-bit integer and formatting two digits yields the display label. Nonfinite channels refuse before either transfer branch.

## @evidence contracts/development/implementation.md#efficient-algorithms

The producer converts each of the three channels once with fixed arithmetic and formatting. Only the seven-character label is returned.

# src/math/AutoMovieEngineMath.ts#AutoMovieEngineMath.weldMeshVertices

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc specifies finite metre-space XYZ, the topology grid, first-occurrence identity order, holes and refusal conditions. The returned index population follows the source vertices.

## @evidence contracts/development/implementation.md#principled-implementation

The owner checks tuple cardinality and admits every coordinate before building a label. Safe rounded indices identify the topology cells, including canonical zero. Beyond that axis-local grid range the exact coordinate label keeps distinct represented positions distinct. Interning the complete triple assigns one identity per label in encounter order.

## @evidence contracts/development/implementation.md#efficient-algorithms

One loop computes three labels per source vertex and consults a map keyed by the joined tuple. The map can hold at most one entry per source vertex and stays local to the call. The result owns the two index and label arrays.
