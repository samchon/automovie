# src/geometry/curve/AutoMovieBernsteinAlgebra64.ts#AutoMovieBernsteinAlgebra64.choose

## @evidence contracts/development/implementation.md#principled-implementation

Multiplies the k binomial factors in ascending i order.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A direct multiplicative coefficient helper serves the product convolution.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No factorial overflow path or approximate combinatorial lookup replaces the stated arithmetic.

## @evidence contracts/development/common.md#meaningful-documentation

Return a binomial coefficient used by exact Bernstein-product algebra before floating rounding.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(k) scalar operations; caller-supplied nonnegative integer degree/index are premises.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Product terms consume the same binomial definition; this operation schedules no cross-request work.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only one scalar accumulator survives the loop.

# src/geometry/curve/AutoMovieBernsteinAlgebra64.ts#AutoMovieBernsteinAlgebra64.scalar

## @evidence contracts/development/implementation.md#principled-implementation

Bernstein endpoint identities select the first or last coefficient directly; other parameters use scalar De Casteljau levels a+t(b-a). Canonical boundaries compare shared endpoint identities exactly, so repeating affine arithmetic at an endpoint must not invent a different coefficient.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Degrees up to three use scalar locals for the same De Casteljau levels; higher degrees reduce one private coefficient row. Neither path mutates the supplied polynomial.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No sampling fit, parameter clamp or degree reduction is performed.

## @evidence contracts/development/common.md#meaningful-documentation

States exact endpoint coefficient identity and the unchanged De Casteljau path for other parameters, including extrapolation; the coefficient array is nonempty.

## @evidence contracts/development/implementation.md#efficient-algorithms

Endpoint selection is constant work. Degrees zero through three use at most six affine blends without a heap row; higher degrees require O(n²) blends and one O(n) coefficient copy for degree n, without per-level allocation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Short nets keep successive levels in scalar locals, with the quadratic tail shared by degrees two and three. Ascending indices for higher degrees read each previous level's right neighbour before overwriting it. Both retain the same a+t(b-a) arithmetic and read original controls once; no cross-parameter cache survives.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Short nets retain at most four scalar locals; the private row for higher degrees expires after evaluation. Only a scalar escapes.

# src/geometry/curve/AutoMovieBernsteinAlgebra64.ts#AutoMovieBernsteinAlgebra64.value

## @evidence contracts/development/implementation.md#principled-implementation

The Bernstein identities at t=0 and t=1 return a clone of the supplied endpoint. All other parameters repeat the same affine De Casteljau operation in all three coordinates. This retains the coefficient identity required by canonical boundary incidence without changing interior or extrapolation arithmetic.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The input net is cloned before reduction through neighboring rows.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No sampled cubic or coordinate normalization replaces the supplied degree.

## @evidence contracts/development/common.md#meaningful-documentation

States the nonempty input, exact endpoint identity, unchanged nonterminal arithmetic and alias-free returned vector.

## @evidence contracts/development/implementation.md#efficient-algorithms

Endpoint evaluation copies one vector; other parameters require O(n²) three-component blends for degree n.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each reduction row supplies the complete next level in the same evaluation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned vector belongs to the local cloned/evaluated net, with no input alias.

# src/geometry/curve/AutoMovieBernsteinAlgebra64.ts#AutoMovieBernsteinAlgebra64.tangent

## @evidence contracts/development/implementation.md#principled-implementation

Adjacent coefficient differences are multiplied by degree and the caller chart-scale factor.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The differentiated net remains an ordinary vector Bernstein polynomial.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Derivative magnitudes and chart units are not normalized away.

## @evidence contracts/development/common.md#meaningful-documentation

Differentiate vector coefficients and apply the caller chart-scale factor.

## @evidence contracts/development/implementation.md#efficient-algorithms

One vector difference per adjacent pair gives O(n) work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Derivative coefficients can be reused by quotient and grid callers without finite differences.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only newly allocated derivative triples escape.

# src/geometry/curve/AutoMovieBernsteinAlgebra64.ts#AutoMovieBernsteinAlgebra64.dScalar

## @evidence contracts/development/implementation.md#principled-implementation

Adjacent scalar differences are multiplied by degree and chart scale; a constant differentiates to zero.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Scalar differentiation shares Bernstein ordering with scalar evaluation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No sampled difference or nonzero constant derivative is introduced.

## @evidence contracts/development/common.md#meaningful-documentation

Differentiate scalar coefficients; a constant returns the zero constant.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over n adjacent pairs, O(n).

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The derivative net is returned as reusable coefficients.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

A fresh scalar array retains neither the source net nor a parameter.

# src/geometry/curve/AutoMovieBernsteinAlgebra64.ts#AutoMovieBernsteinAlgebra64.elevateScalar

## @evidence contracts/development/implementation.md#principled-implementation

Repeated degree elevation blends adjacent coefficients with i/n and 1-i/n and preserves endpoints.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scalar degree-elevation owner is reused by vector and sum operations.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Requested degree reduction rejects rather than fitting lower-degree coefficients.

## @evidence contracts/development/common.md#meaningful-documentation

Raise scalar degree without changing its polynomial; a requested reduction rejects.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each added degree requires a pass over its new coefficient row.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The most recently elevated row supplies the next step, with no restart from the original degree.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the final new coefficient array escapes the invocation.

# src/geometry/curve/AutoMovieBernsteinAlgebra64.ts#AutoMovieBernsteinAlgebra64.elevate

## @evidence contracts/development/implementation.md#principled-implementation

Each of three coordinate columns receives the same scalar degree elevation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Coordinate-column assembly delegates elevation to the scalar owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

All coordinates keep one common target degree, without independent approximation.

## @evidence contracts/development/common.md#meaningful-documentation

Raise each vector coordinate to one common Bernstein degree.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three scalar elevations dominate time, plus linear row transposition.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The elevated coordinate columns are each computed once for the returned net.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Output triples are independent of input controls and temporary columns expire.

# src/geometry/curve/AutoMovieBernsteinAlgebra64.ts#AutoMovieBernsteinAlgebra64.product

## @evidence contracts/development/implementation.md#principled-implementation

Binomial-weighted convolution accumulates every contributing coefficient pair in ascending i order.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scalar product supplies both scalar and vector rational algebra.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No pointwise sampled multiplication or reduced-degree replacement substitutes for the exact coefficient formula.

## @evidence contracts/development/common.md#meaningful-documentation

Multiply scalar Bernstein polynomials using binomial-weighted convolution.

## @evidence contracts/development/implementation.md#efficient-algorithms

For degrees m and n, convolution enumerates contributing pairs; choose computes each binomial factor without retained lookup tables.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

No effectful work or cross-request cache is coordinated; each product depends on its current coefficient values.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the degree m+n scalar output array is returned.

# src/geometry/curve/AutoMovieBernsteinAlgebra64.ts#AutoMovieBernsteinAlgebra64.productV

## @evidence contracts/development/implementation.md#principled-implementation

Each vector coordinate is multiplied by the supplied scalar polynomial using the same convolution.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Vector multiplication delegates its three scalar columns to product.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Coefficient degree and original coordinate ordering are preserved.

## @evidence contracts/development/common.md#meaningful-documentation

Multiply each vector coordinate by a scalar Bernstein polynomial.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three scalar convolutions dominate cost and result storage is linear in output degree.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A scalar numerator is reused as the operand of each coordinate product within this call.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The new vector net does not retain either operand.

# src/geometry/curve/AutoMovieBernsteinAlgebra64.ts#AutoMovieBernsteinAlgebra64.add

## @evidence contracts/development/implementation.md#principled-implementation

Both vector polynomials elevate to the common maximum degree before adding factor-scaled coefficients.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Degree reconciliation is delegated to the shared elevation owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Unequal degrees are not padded with zeros or compared as sampled points.

## @evidence contracts/development/common.md#meaningful-documentation

Elevate to a common degree, then add the scaled vector polynomial.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two degree elevations plus one output-row pass determine cost.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The common degree is resolved once for both operands.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only independent summed triples escape; elevated operands are local.

# src/geometry/curve/AutoMovieBernsteinAlgebra64.ts#AutoMovieBernsteinAlgebra64.addS

## @evidence contracts/development/implementation.md#principled-implementation

Scalar operands elevate to the same maximum degree before scaled addition.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Scalar sums reuse scalar elevation rather than a second degree-conversion rule.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No coefficient padding or sampled fitting changes the operands.

## @evidence contracts/development/common.md#meaningful-documentation

Elevate to a common degree, then add the scaled scalar polynomial.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two scalar elevations and one coefficient pass determine cost.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One common degree is shared by both current operands.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The new sum array retains neither operand nor elevation scratch arrays.

# src/geometry/curve/AutoMovieBernsteinAlgebra64.ts#AutoMovieBernsteinAlgebra64.scale

## @evidence contracts/development/implementation.md#principled-implementation

Every coefficient vector is multiplied by the same scalar.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Degree-preserving scaling is distinct from chart reparameterization.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No component or coefficient is omitted by a small-value cutoff.

## @evidence contracts/development/common.md#meaningful-documentation

Multiply every vector coefficient by the same scalar without changing degree.

## @evidence contracts/development/implementation.md#efficient-algorithms

One fixed-size vector operation per control gives O(n) work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The current factor is applied directly without retaining previous products.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

A new vector net owns the scaled controls.
