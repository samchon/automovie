# src/geometry/construction/AutoMovieSolidIntersectionWalk.ts#AutoMovieSolidIntersectionWalk.create

## @evidence contracts/development/implementation.md#principled-implementation

Uses the original tangent-plane pseudo-arclength walk to measure the loop. Both endpoint tangents must face the closing chord of the equal-chord walk. Its signed length distinguishes a return from an overshoot. A directed chord within the ordinary corrected-step allowance qualifies the guide for periodic interpolation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One preparation returns the reference law and original start preimages for parameterized tracing.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves bounded halving, tangent fallback and the secant adjustment. A failed or exhausted candidate can publish only when its closing chord passes the same direction and distance checks.

## @evidence contracts/development/common.md#meaningful-documentation

States mm chords, callback ownership, fixed limits passed from the public constants and original string failures.

## @evidence contracts/development/implementation.md#efficient-algorithms

For C targets, the first walk permits walkSteps*C steps with bounded failed halvings. Each reference chord uses one full step or at most walkSteps shortened attempts. An accepted shortened step decreases the remaining distance and regrows toward half the nominal chord. One initial and at most closingSteps equal walks each use walkPoints*C points.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the original previous iterate/tangent and accepted reference points; each secant candidate deliberately performs the same new equal walk.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Walk arrays and iterates are local; the returned law owns its prepared reference controls and the result owns one start tuple, with no global cache or task.
