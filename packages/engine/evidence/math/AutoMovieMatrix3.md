# src/math/AutoMovieMatrix3.ts#AutoMovieMatrix3.skew

## @evidence contracts/development/implementation.md#principled-implementation

The antisymmetric row-major arrangement expands the Cartesian cross product with the supplied vector as its left operand.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One explicit cross-product matrix supports numerical linear-map derivatives without renderer or camera conventions.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every finite component keeps its original magnitude and sign; the vector is not normalized or interpreted as an angle.

## @evidence contracts/development/common.md#meaningful-documentation

States operand order, handedness, row order and unchanged vector magnitude.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed-size admission and nine scalar entries require constant work and storage.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A mutable vector has no retained matrix identity or shared cross-call work.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Only a fresh nine-number array escapes; no operand or external resource is retained.

# src/math/AutoMovieMatrix3.ts#AutoMovieMatrix3.multiply

## @evidence contracts/development/implementation.md#principled-implementation

The (row,column) output is the three-term dot product of the left row and right column. Finite operands do not guarantee a representable product, so nonfinite outputs throw.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One fixed product supplies numerical composition without scene transform conventions.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No product term is capped or silently rescaled and no invalid operand becomes identity.

## @evidence contracts/development/common.md#meaningful-documentation

States row-major order, unchanged operands and finite-output refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Computes 27 scalar products and nine three-term sums after fixed-size admission, retaining one nine-number result.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

This pure product has no shared mutable-input cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Only the owned nine-number result escapes; no resource is acquired.

# src/math/AutoMovieMatrix3.ts#AutoMovieMatrix3.transpose

## @evidence contracts/development/implementation.md#principled-implementation

Index permutation computes the exact transpose of the supplied doubles without arithmetic or a change of coordinate units.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The common row/column interchange is explicit at every numerical composition site.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No order-dependent mutation or implicit inverse replaces the transpose.

## @evidence contracts/development/common.md#meaningful-documentation

States new ownership and row-major index meaning.

## @evidence contracts/development/implementation.md#efficient-algorithms

Copies nine admitted values in constant work and storage.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Transpose coordinates no work across requests.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A fresh nine-number array escapes and no other state persists.

# src/math/AutoMovieMatrix3.ts#AutoMovieMatrix3.apply

## @evidence contracts/development/implementation.md#principled-implementation

Three row dot products compute ordinary linear action, including a homogeneous vector when the caller supplies one. Nonfinite output throws rather than becoming a point at a guessed depth.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Explicit retained homogeneous coordinates let the projection owner test its own denominator and visibility.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No homogeneous divide, normalization or small-denominator compensation changes the supplied linear map.

## @evidence contracts/development/common.md#meaningful-documentation

Gives vector orientation, third-coordinate retention, borrowing and finite-range refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Nine multiplications and fixed-size admission produce one three-number tuple.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Mutable inputs have no retained application cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The new tuple transfers to its caller and no handle or shared state remains.
