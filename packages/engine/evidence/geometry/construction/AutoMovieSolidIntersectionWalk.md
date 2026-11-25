# src/geometry/construction/AutoMovieSolidIntersectionWalk.ts#AutoMovieSolidIntersectionWalk.create

## @evidence contracts/development/implementation.md#principled-implementation

Uses the original tangent-plane pseudo-arclength walk followed by equal-chord walks and the existing periodic reference law; arc remains an approximation to requested exact arclength.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One preparation returns the reference law and original start preimages for parameterized tracing.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves halving, tangent fallback, secant arithmetic and last valid walk on closing exhaustion; adds no numerical or domain repair.

## @evidence contracts/development/common.md#meaningful-documentation

States mm chords, callback ownership, fixed limits passed from the public constants and original string failures.

## @evidence contracts/development/implementation.md#efficient-algorithms

For C targets, the first walk permits walkSteps*C steps with bounded failed halvings; one initial and at most closingSteps equal walks each use walkPoints*C points, plus existing solve costs.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the original previous iterate/tangent and accepted reference points; each secant candidate deliberately performs the same new equal walk.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Walk arrays and iterates are local; the returned law owns its prepared reference controls and the result owns one start tuple, with no global cache or task.
