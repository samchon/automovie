# src/geometry/construction/AutoMovieStationHermite.ts#AutoMovieStationHermite.weights

## @evidence contracts/development/implementation.md#principled-implementation

Evaluates the cubic/quintic Hermite basis and its first/second derivatives with H and 1/H chain-rule factors; H must be nonzero and numerically representable.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One six-entry order serves values, slopes and curvatures, with zero curvature weights for the cubic rule.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the requested order and basis directly without clamping u, H or derivative magnitudes; valid interval admission stays with the chain.

## @evidence contracts/development/common.md#meaningful-documentation

Specifies six-array order, interval units, supported derivative orders and pre-applied chain-rule scaling.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed-degree formulas take constant time and fixed-size temporary/result arrays.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Returns weights once for a station/order so the owning reader can share them across every coefficient of that interval.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns six returned numbers; intermediate cubic/quintic arrays are call-local and no interval cache is owned.

# src/geometry/construction/AutoMovieStationHermite.ts#AutoMovieStationHermite.combine

## @evidence contracts/development/implementation.md#principled-implementation

Applies the six Hermite weights componentwise to endpoint values/jets, treating each absent curvature as zero as required by the cubic encoding.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One array map keeps the summation order identical for section, plane and lift consumers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not fit or normalize values; equal endpoint widths and six compatible weights are caller premises, and missing non-curvature entries are not repaired.

## @evidence contracts/development/common.md#meaningful-documentation

Identifies lower/upper endpoints and the weights producer; IEnd documents optional curvature.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(W) work and output for W components, with constant arithmetic per component.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every output component uses the supplied common weights instead of recomputing basis polynomials.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh W-entry array; no endpoint or weight reference is retained by the module.

# src/geometry/construction/AutoMovieStationHermite.ts#AutoMovieStationHermite.framed

## @evidence contracts/development/implementation.md#principled-implementation

Checks field presence to select componentwise plane interpolation in the chain reader.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One two-field predicate separates interpolation-mode selection from arithmetic.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Presence does not validate orthonormality, numeric values or frame curvatures and does not certify a full surface jet.

## @evidence contracts/development/common.md#meaningful-documentation

States exactly which two fields are required and which derivative order stays optional.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two property-presence comparisons use constant time with no allocation.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

This predicate coordinates no shared interval preparation.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returning a boolean retains no layer or resource.

# src/geometry/construction/AutoMovieStationHermite.ts#AutoMovieStationHermite.frameEnd

## @evidence contracts/development/implementation.md#principled-implementation

Flattens the layer's frame and first/optional second derivative records into identically ordered nine-component endpoint arrays.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One adapter connects frame-shaped storage to the common Hermite array representation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Requires frame and frameSlopes from the caller; an absent frame curvature remains absent, without fabricated axes or derivative estimates.

## @evidence contracts/development/common.md#meaningful-documentation

Gives the origin/u/v order and optional curvature relationship used by interval selection.

## @evidence contracts/development/implementation.md#efficient-algorithms

Copies two or three nine-entry arrays in constant work and space.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The returned endpoint can serve multiple station derivative orders with their shared interval weights; this adapter owns no cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The new endpoint owns its flattened arrays without retaining the original layer or its tuples.

# src/geometry/construction/AutoMovieStationHermite.ts#AutoMovieStationHermite.unflat

## @evidence contracts/development/implementation.md#principled-implementation

Regroups interpolated components into the same affine basis and derivative record layout used by the chain.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Three literal triples expose the fixed flattening convention.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not claim component interpolation preserves orthonormality or modify its axes; nine valid entries are a caller premise.

## @evidence contracts/development/common.md#meaningful-documentation

States layout and the absence of renormalization, which matters to analytic station derivatives.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant nine-component copying and fixed output storage.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

This one record conversion owns no coordinated or cached work.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns three fresh tuples; no reference to the input component array survives.
