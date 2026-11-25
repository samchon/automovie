# src/core/ArchetypeMassArithmetic.ts#ArchetypeMassArithmetic.ratio

## @evidence contracts/development/common.md#meaningful-documentation

States the factor signs, numeric domain, exact fallback and final representability.

## @evidence contracts/development/implementation.md#principled-implementation

Cancelling no physical quantity, the exceptional path multiplies the exact integer significands and subtracts denominator exponents, then rounds the quotient to nearest binary64 with ties to even.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit factors, take the ordinary product/quotient when finite and nonzero, otherwise evaluate that same rational exactly.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Zero is returned only for a zero numerator or final representational underflow; neither an overflowing intermediate nor a density ratio is clamped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Four fixed factors bound both ordinary work and fallback integer width by binary64's exponent/significand range.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only the exceptional path decomposes factors with one shared call-local ArchetypeBinary64 reader; no normal-call integer conversion or view allocation is performed.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Call-local scalars and bounded integers only.

# src/core/ArchetypeMassArithmetic.ts#ArchetypeMassArithmetic.localProduct

## @evidence contracts/development/common.md#meaningful-documentation

States factor premises, normal grouping and the local representation refusal marker.

## @evidence contracts/development/implementation.md#principled-implementation

Relative weight is a local datum consumed by normalization and weighted centres before aggregate mass allocation. Normal products retain the existing grouping. For a subnormal result, exact dyadic multiplication minus the represented result must be exactly zero, so quantization cannot change the weight before a large coordinate or lever magnifies it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit factors, compute the shared product, then compare exact and represented values only at the subnormal boundary.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Exact subnormal products remain supported; null is an explicit unsupported local datum for weightOf to refuse with its part id, never a replacement zero. Authored zero shares do not call this positive implicit-product path.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two fixed factors bound scalar work and exceptional integer width; ordinary normal products allocate no exact reader.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses product and the single Binary64/multiply/add owners for exact equality; no density or geometry representation is duplicated.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Scalars and exceptional dyadic records are call-local and no view, input or history escapes.

# src/core/ArchetypeMassArithmetic.ts#ArchetypeMassArithmetic.weightedProduct

## @evidence contracts/development/common.md#meaningful-documentation

States the physical allocation, signed factor domain, optional identities, result and synchronous reader lifetime.

## @evidence contracts/development/implementation.md#principled-implementation

A normal allocated mass below the highest binade uses the existing product grouping. At underflow or overflow boundaries, its exact mass*weight numerator and scale*total denominator remain separate from geometric factors until one quotient rounds the complete contribution to nearest binary64, ties to even. A nonzero subnormal allocation is not an exact mass operand: its rounding error could be magnified by a large local moment or lever.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit and allocate once, then return either the ordinary product reader or a fixed-factor exact quotient reader.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No positive weight is omitted because its scalar allocated mass rounds to zero. Truly final underflow/overflow remains representational; parts still publishes its independently rounded scalar masses and local primitive admission is unchanged.

## @evidence contracts/development/implementation.md#efficient-algorithms

One allocation per solid and constant work per contribution. The exceptional numerator has at most five finite binary64 factors and the denominator two, bounding integer width independently of scene size.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses ratio, product, the single exact multiply/quotient owner and one exceptional binary64 reader. All intrinsic and parallel-axis terms of one solid share its fixed exact allocation factors.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned synchronous reader retains only allocation scalars or their bounded dyadic values and one call-local eight-byte view; of discards it after this solid's six tensor entries. No model, history or global buffer is retained.

# src/core/ArchetypeMassArithmetic.ts#ArchetypeMassArithmetic.product

## @evidence contracts/development/common.md#meaningful-documentation

States finite signed factors, optional identities and final underflow/overflow meaning.

## @evidence contracts/development/implementation.md#principled-implementation

The fallback multiplies exact signed significands and adds exponents, then rounds once to binary64; this preserves a small mass times large squared lever when the final product is finite.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit, ordinary multiplication, exact exceptional product.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No magnitude cap or epsilon substitutes a representable product.

## @evidence contracts/development/implementation.md#efficient-algorithms

Four factors give constant bounded work and integer width.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The ordinary path creates no factor array or dyadic values.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

No retained input or resource.

# src/core/ArchetypeMassArithmetic.ts#ArchetypeMassArithmetic.sum

## @evidence contracts/development/common.md#meaningful-documentation

States signed finite terms, accumulation order and final overflow meaning.

## @evidence contracts/development/implementation.md#principled-implementation

The normal ordered sum is retained. Non-finite output or a result in the largest normal binade invokes exact aligned dyadic summation before final rounding, preserving cancellation and the overflow midpoint.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Check and add terms, then use one exact reduction only on non-finite output.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

True non-finite contributions are refused rather than hidden as cancellation or zero.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in contribution count on both paths, with exponent width bounded by binary64 plus logarithmic sum carry.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Ordinary sums perform no integer decomposition.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Temporary exact terms exist only in the fallback call.

# src/core/ArchetypeMassArithmetic.ts#ArchetypeMassArithmetic.mean

## @evidence contracts/development/common.md#meaningful-documentation

States matching input lengths, finite coordinates, nonnegative nonempty weights and finite convex output.

## @evidence contracts/development/implementation.md#principled-implementation

Scale weights and coordinates by their maxima, sum normalized products and divide by the same ordered positive-weight sum. Every normalized coordinate is in [-1,1], bounding the quotient without a clamp. If scaling underflows a nonzero factor or term, or a caller explicitly needs the same final rounding law across related means, exact dyadic weighted numerator/denominator rounds only the final quotient.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit and find scales, preserve an all-zero coordinate result, then use the normal scaled path unless exact arithmetic is requested or normalization loses precision.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No small-weight cutoff, coordinate cap or guessed mean is used; a singleton and all-zero coordinates follow the same convex law.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two linear passes and constant scalar state normally; the exceptional exact reduction retains O(N) dyadic terms with binary64-bounded exponent span plus sum carry.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One coordinate/weight scale serves the entire component mean. Requested exact means and detected scaling loss share the same single dyadic reduction; existing two-argument callers keep their ordinary arithmetic.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

All arrays and integer terms are call-local; no body, input history or handle is retained.

# src/core/ArchetypeMassArithmetic.ts#ArchetypeMassArithmetic.normalization

## @evidence contracts/development/common.md#meaningful-documentation

States input signs, scale units and normalized total.

## @evidence contracts/development/implementation.md#principled-implementation

Dividing every weight by the same positive maximum preserves their relative allocation while each summed term lies in [0,1]. The total is at most the array length, rather than a potentially overflowing physical weight sum.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit and find the maximum, then sum the normalized weights.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No zero-total fallback, small-weight cutoff or physical weight cap is introduced; ratio's exact exceptional path can restore a tiny numerator.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two linear passes and constant scalar state.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One result is shared by all of's or parts' allocations.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns only two numbers and retains no array.

# src/core/ArchetypeMassArithmetic.ts#ArchetypeMassArithmetic.vectorMean

## @evidence contracts/development/common.md#meaningful-documentation

States common space, matching weights and scalar-owner refusals.

## @evidence contracts/development/implementation.md#principled-implementation

A vector's mass-weighted mean is the same scalar convex mean in each independent coordinate.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Three component projections and mean calls.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Adds no coordinate fallback, mass guess or special geometry case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three linear reductions use O(N) temporary component arrays; exact fallback is scalar mean's exceptional path.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

of and combine share the same scalar mean and coordinate projection owner.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Only a new three-number vector escapes; component arrays are call-local.
