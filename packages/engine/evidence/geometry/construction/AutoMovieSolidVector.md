# src/geometry/construction/AutoMovieSolidVector.ts#AutoMovieSolidVector.add

## @evidence contracts/development/implementation.md#principled-implementation

Adds corresponding Cartesian components; callers supply compatible frames and units.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Direct component arithmetic returns one tuple without a vector-object layer.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Applies ordinary number addition without offsets, clamping or consumer branches.

## @evidence contracts/development/common.md#meaningful-documentation

Names both operands and the returned vector sum.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three additions take constant time and one three-number result.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A componentwise sum has no shared preparation or coordinated effects.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the fresh tuple; neither input is changed or retained.

# src/geometry/construction/AutoMovieSolidVector.ts#AutoMovieSolidVector.sub

## @evidence contracts/development/implementation.md#principled-implementation

Subtracts compatible Cartesian components, preserving the operand order used for displacements.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The three subtractions expose that order directly.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not reverse axes, snap small differences or adjust contacts.

## @evidence contracts/development/common.md#meaningful-documentation

Specifies a-b rather than an unsigned separation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work and a fixed three-number output.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

No interval, phase or request preparation is coordinated here.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new tuple and keeps no reference to either operand.

# src/geometry/construction/AutoMovieSolidVector.ts#AutoMovieSolidVector.scale

## @evidence contracts/development/implementation.md#principled-implementation

Scalar multiplication applies the same factor to all Cartesian components.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A plain tuple result leaves units and factor interpretation with the caller.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No component-specific factor or magnitude clamp changes the vector's direction law.

## @evidence contracts/development/common.md#meaningful-documentation

Defines the factor and the multiplication order's mathematical result.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three products and one tuple use constant time and space.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

This scalar operation owns no reusable phase or request state.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the returned tuple escapes; the supplied vector is read-only.

# src/geometry/construction/AutoMovieSolidVector.ts#AutoMovieSolidVector.combine

## @evidence contracts/development/implementation.md#principled-implementation

Accumulates the supplied linear combination componentwise in input order; weights and vectors must have compatible units and representable products.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One accumulator handles arbitrary term counts and the empty sum.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves ordinary ordered floating-point summation without reweighting or fixture-dependent terms.

## @evidence contracts/development/common.md#meaningful-documentation

States the weight/vector pair format and zero result for no terms.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(T) work for T terms and O(1) accumulator storage avoid an intermediate vector per term.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each term's weight is read once and serves all three components in the same traversal.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one fresh tuple and retains neither the term list nor its vector references.

# src/geometry/construction/AutoMovieSolidVector.ts#AutoMovieSolidVector.dot

## @evidence contracts/development/implementation.md#principled-implementation

The Euclidean Cartesian dot product multiplies matching components and sums them; finite inputs alone do not guarantee finite products.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The scalar formula is directly visible to projection and solve callers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Performs no normalization or conditioning adjustment hidden from the caller.

## @evidence contracts/development/common.md#meaningful-documentation

States the operand/result relation; the namespace explains arithmetic-scale premises.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three products and two additions use constant work without a result array.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

No reusable preparation belongs to this scalar inner product.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a number without retaining state or inputs.

# src/geometry/construction/AutoMovieSolidVector.ts#AutoMovieSolidVector.cross

## @evidence contracts/development/implementation.md#principled-implementation

Uses the right-handed Cartesian cross-product determinant in the supplied frame.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Three explicit components keep the orientation convention with this algebra owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not choose a fallback normal for parallel vectors or normalize a small result.

## @evidence contracts/development/common.md#meaningful-documentation

Specifies the ordered a-cross-b operation used by orientation callers.

## @evidence contracts/development/implementation.md#efficient-algorithms

Six products and three subtractions take constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A single cross product coordinates no repeated operation or shared cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh three-number tuple and holds no operand references.

# src/geometry/construction/AutoMovieSolidVector.ts#AutoMovieSolidVector.norm

## @evidence contracts/development/implementation.md#principled-implementation

Delegates the Euclidean norm to Math.hypot rather than directly squaring components; the true norm can still exceed Number.MAX_VALUE.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The standard numeric primitive owns the three-component norm calculation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves Math.hypot's zero, nonfinite and overflow results rather than substituting a length.

## @evidence contracts/development/common.md#meaningful-documentation

Defines Euclidean length with the input's component units.

## @evidence contracts/development/implementation.md#efficient-algorithms

One fixed-arity hypot call takes constant time and no output collection.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A norm reading coordinates no reusable preparation.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Only a number is returned; no input or handle is retained.

# src/geometry/construction/AutoMovieSolidVector.ts#AutoMovieSolidVector.unit

## @evidence contracts/development/implementation.md#principled-implementation

Divides components by the computed Euclidean norm under its finite positive norm premise; zero or NaN norm returns null.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One norm and one positive-length branch implement the nullable normalization result.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Adds no arbitrary fallback direction; an infinite or heavily quantized norm is not repaired and does not establish a unit result.

## @evidence contracts/development/common.md#meaningful-documentation

States the positive-norm branch and the numerical limit instead of promising normalization for every finite triple.

## @evidence contracts/development/implementation.md#efficient-algorithms

One hypot and three divisions use constant work and at most one returned tuple.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Computes the norm once for all three component divisions.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Null or a caller-owned new triple escapes; no state survives the call.

# src/geometry/construction/AutoMovieSolidVector.ts#AutoMovieSolidVector.solve3

## @evidence contracts/development/implementation.md#principled-implementation

Cramer's rule solves the fixed three-column system after a determinant-to-column-norm test; well-scaled representable products are required and the test is not an error certificate.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Fixed-size determinant formulas avoid a general elimination setup for this three-variable Newton step.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Returns null when the strict 1e-14 relative test fails, without regularizing or inventing a contact displacement.

## @evidence contracts/development/common.md#meaningful-documentation

Gives column orientation, the right-hand side and the exact rejection scale.

## @evidence contracts/development/implementation.md#efficient-algorithms

A fixed number of dot/cross/norm operations and small temporary triples take constant work and space.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the accepted determinant in all three quotient components; cross-product temporaries are computed by the stated formulas rather than globally cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Temporaries die with the synchronous call; a successful solve returns a fresh triple without retaining matrix columns.

# src/geometry/construction/AutoMovieSolidVector.ts#AutoMovieSolidVector.solve2

## @evidence contracts/development/implementation.md#principled-implementation

Applies the two-variable Cramer formulas with a relative determinant test against the two determinant products; finite representable products are a caller premise.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Four scalar entries and one two-component right-hand side expose the general matrix without a matrix class.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A failed strict 1e-14 test returns null rather than shifting the diagonal or returning an approximate regularized answer.

## @evidence contracts/development/common.md#meaningful-documentation

Specifies row/column order, output and the rejection expression.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant scalar arithmetic and at most one two-number output replace a general solver for this fixed size.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The determinant is formed once and shared by both solution quotients.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns null or a new pair; no coefficient or right-hand-side reference is retained.

# src/geometry/construction/AutoMovieSolidVector.ts#AutoMovieSolidVector.solve

## @evidence contracts/development/implementation.md#principled-implementation

Partial-pivot Gaussian elimination solves a finite square system with matching right-hand-side length; the fixed relative pivot threshold is an admission test, not a condition-number bound.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

prepareLinearSystem owns the shared partial-pivot elimination/back substitution used by both this ordinary augmented solve and repeated digit task-priority columns.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A pivot not greater than 1e-14 times the largest original entry returns null; there is no retry, regularization or hidden fallback system.

## @evidence contracts/development/common.md#meaningful-documentation

Gives square row layout, nonmutation, current four-variable workload and the pivot rejection rule.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(N^3) elimination and one O(N^2) augmented matrix retain the ordinary small-system path without prepared-factor rows, pivot arrays or a solver closure. No sparse or large-system optimality is claimed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Ordinary and repeated matrix consumers share one pivot/elimination owner, but this one-shot entry updates its actual augmented column directly rather than retaining factors or caching a solution.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The augmented matrix and scalar pivot temporaries are call-local on success or early null; only the O(N) solution array escapes.
