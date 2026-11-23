# src/drawing/autoMovieDrawingFrame.ts#autoMovieDrawingFrame

## @evidence contracts/development/implementation.md#principled-implementation

Builds a right-handed orthonormal basis by two cross products after normalizing the viewing direction, which is exact up to rounding whenever up and direction are non-zero and not parallel, the premises the guards establish; the reflection is a single axis negation, which mirrors the page about its up axis.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns both the placement checks every drawing derivation needs and the basis they protect, so no caller can resolve a frame from an unchecked view; the vector and depth checks are private helpers shared by the three vector and two depth fields.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Projections differ only by the documented ceiling-plan negation; a degenerate view throws instead of falling back to a default axis.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the axis construction, the origin's role, the reflection and its purpose, every refused input and the failure type, and that the returned axes are unit vectors.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant time: a fixed number of checks, two cross products and two normalizations.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per derived drawing for its one view, so there is no repeated request to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns four small vectors owned by the caller and keeps nothing.
