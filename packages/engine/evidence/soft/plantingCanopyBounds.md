# src/soft/plantingCanopyBounds.ts#plantingCanopyBounds

## @evidence contracts/development/implementation.md#principled-implementation

Cylinder radial support on coordinate axis i is r*sqrt(1-u_i*u_i); endpoints bound axial support. The maximum end radius conservatively encloses the declared taper and averaged cylinder. Four transformed unit-card corners exactly bound each planar leaf under the emitted rigid transform, subject to binary64 arithmetic and finite generated geometry.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The growth owner measures its emitted branch/leaf records once, and installation validation transforms this complete recipe-local envelope rather than mistaking centreline endpoints for canopy coverage.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No guessed foliage width, fixture wall margin or renderer-only clipping repairs clearance; maximum stem radius is an explicit conservative bound and a zero-length stem uses the viewer's identity/+Y cylinder axis.

## @evidence contracts/development/common.md#meaningful-documentation

States recipe-local ownership, taper/averaged-cylinder coverage, exact leaf-card basis, empty null result and floating representation premises; it does not certify GPU rounding or appearance.

## @evidence contracts/development/implementation.md#efficient-algorithms

For B branches and L leaves, two endpoint supports and four transformed card corners per record take O(B+L) time with constant extra live storage and one fresh bounds result.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The branch unit axis and three radial supports are computed once for both endpoints; emitted leaf TRS drives all four corners, and one recipe envelope serves every installation member transform without a retained cross-recipe cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The mutable extrema belong to this call and transfer only as the fresh result; temporary support/rotated-point records are discarded, and no branch/leaf input, mesh or GPU resource is retained.
