# src/geometry/AutoMovieEngineCanonicalBoundary64.ts#AutoMovieEngineCanonicalBoundary64.phase

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc states the normalized input domain, exact key spelling, ties-to-even numeric view and preservation of the endpoint's signed zero.

## @evidence contracts/development/implementation.md#principled-implementation

The finite unit gate admits only distinct interval endpoints and a normalized fraction. Decoding their binary64 dyadics makes the affine sum exact. Normalization makes each nonzero key odd. Quotient and remainder round the result once to the normal or subnormal grid, using even significand on a tie. Exact zero has one key while an input endpoint keeps its signed numeric zero.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three scalar admissions precede bounded exact dyadic arithmetic. Bit widths are bounded by the two endpoint significands, one fraction and the binary64 exponent range. The function returns one owned record and retains no input or arithmetic scratch.

# src/geometry/AutoMovieEngineCanonicalBoundary64.ts#AutoMovieEngineCanonicalBoundary64.local

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc identifies the directed interval, key and view admission, endpoint behavior and the requirement to keep canonical identity after numeric inversion.

## @evidence contracts/development/implementation.md#principled-implementation

Admission validates finite normalized endpoints and a canonical key whose rounded value agrees with its view. Exact differences against both endpoints prove containment in the stated direction. Dividing the exact offset by interval width gives the local coordinate, rounded once to nearest even. Exact endpoints return 0 or 1, and an interior address whose inverse rounds to an endpoint throws.

## @evidence contracts/development/implementation.md#efficient-algorithms

The bounded phase spelling is parsed once. A fixed number of dyadic differences and an integer division serve one read, using only call-local operands and scalar output.

# src/geometry/AutoMovieEngineCanonicalBoundary64.ts#AutoMovieEngineCanonicalBoundary64.compare

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc explains that exact phase order can distinguish addresses with the same rounded numeric view.

## @evidence contracts/development/implementation.md#principled-implementation

Both parsed keys must have canonical unit-domain spelling and agree with their numerical views. Aligning the dyadic exponents before subtraction makes the result the exact sign of the key difference, including exact equality.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two bounded parses, numeric agreement checks and one exact difference return a scalar sign. The function retains no input.

# src/geometry/AutoMovieEngineCanonicalBoundary64.ts#AutoMovieEngineCanonicalBoundary64.inverse

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc states the normalized local anchors, directed map order, authored address preservation and the bracketing limit for foreign phases.

## @evidence contracts/development/implementation.md#principled-implementation

Finite local anchors increase from 0 to 1 and their verified exact phase values have one strict direction, which can be decreasing. An exact hit returns its authored local. Otherwise a containing anchor bracket is split in ordered binary64 bits. A sampled reversal throws. An attainable target returns its matched local, and an unattainable target can return only an interior bracketing coordinate.

## @evidence contracts/development/implementation.md#efficient-algorithms

The anchor scan calls the supplied map once per anchor. Consecutive samples then narrow the unsigned bit bracket by at least half per step, using one local DataView and the two boundary phases. The returned scalar keeps no callback or anchors.

# src/geometry/AutoMovieEngineCanonicalBoundary64.ts#AutoMovieEngineCanonicalBoundary64.partition

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc identifies exact authority and use names, normalized directed intervals, valid walk signs and the difference between an admission failure and an incidence diagnostic.

## @evidence contracts/development/implementation.md#principled-implementation

The scalar gate forbids nonfinite endpoints and equal ends. Unique use IDs are exact across authorities and each walk is 1 or -1. A reverse interval negates that walk for the increasing atom. At each endpoint the sweep removes ended uses and adds starting uses before creating the next open atom. Sorting its active IDs keeps the parallel walk array aligned and reveals gaps, excessive uses and equal directions.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each use contributes two events. The sweep sorts groups and endpoint coordinates once. For each atom it sorts the active IDs it must publish, then reads each sign once. Event maps and active sets belong to the call, while returned atoms and diagnostics own their arrays.
