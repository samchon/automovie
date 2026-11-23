# src/math/adjacentAutoMovieFloat64.ts#adjacentAutoMovieFloat64

## @evidence contracts/development/implementation.md#principled-implementation

IEEE 754 binary64 orders positive values by their bit patterns read as unsigned integers and negative values in reverse, so the neighbour is the 64-bit pattern plus or minus one, toward larger magnitude when the sign agrees with the direction; the pattern is written big-endian through a `DataView`, so the high and low 32-bit words are the same on every platform, and the low word's wrap carries or borrows into the high word, which `setUint32` reduces modulo 2^32, without BigInt.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One direction flag instead of separate up and down functions, because the projection separation, triangle attachment contact and barycentric seating bounds, the quadratic polisher's dual rounding and the hair exterior interval each pick the direction from a sign at the call site.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Zero is the only special case, because a zero's neighbour toward the opposite sign lies across the sign bit, where decrementing the zero magnitude would wrap to a NaN pattern; an overflow refuses rather than returning the infinity the bit pattern reaches.

## @evidence contracts/development/common.md#meaningful-documentation

States the one-ulp meaning and the direction flag, why callers use it, the signed-zero and subnormal results, and both refusals: a non-finite input and a step past the largest finite value.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time with no allocation per call: one float write, two word reads, two word writes and one float read on a buffer allocated once at module load, instead of a `Float64Array` view pair that would depend on platform endianness.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure scalar function that coordinates no work across calls; the scratch buffer is reused storage, not a reused result.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The module retains one 8-byte buffer for its lifetime; every call writes it before reading and finishes synchronously, so no state survives a call and concurrent callers cannot interleave inside it.
