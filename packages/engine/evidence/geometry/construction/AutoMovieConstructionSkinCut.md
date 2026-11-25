# src/geometry/construction/AutoMovieConstructionSkinCut.ts#AutoMovieConstructionSkinCut.create

## @evidence contracts/development/implementation.md#principled-implementation

The curve is the zero set of the planes' minimum, or smooth minimum, on the skin; its station is a root of a residual that rises into the kept side, and its derivatives are the implicit function theorem's on the skin's 2-jet.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Residual, bracketed root, admitted table, and one crossing check for both reads.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refuses a phase with no crossing in the domain, a phase already inside at the facing end and a tangent crossing; no station is clamped and no derivative differenced. A second crossing between two of the face's stations is not searched for.

## @evidence contracts/development/common.md#meaningful-documentation

States the bracketing, the reader's start and fallback, and the refusals.

## @evidence contracts/development/implementation.md#efficient-algorithms

Building reads `samples` phases over the stations plus one bisection each. Newton iterations and point reads consume only the first derivative along station. The station-jet reader computes the full residual derivatives once at the admitted root.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The admitted roots start both readers. They solve the same equation and share the axial transversality check.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the planes, the stations and `samples` roots; no reading is cached.
