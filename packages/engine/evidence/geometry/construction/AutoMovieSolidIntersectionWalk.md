# src/geometry/construction/AutoMovieSolidIntersectionWalk.ts#AutoMovieSolidIntersectionWalk

## @evidence contracts/development/common.md#meaningful-documentation

Documents original step controls, local arrays and failure values at create.

## @evidence contracts/development/design.md#principled-representation

Represents Original arc-mode loop preparation, separate from parameterized trace publication: companion namespace of 2 members (`IWalk`, `create`); units and frames named in its text: second, local, world. It has no optional member, so no absent-value state combines with another.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the module that declares `AutoMovieSolidIntersectionWalk` in packages/engine/src/geometry/construction/AutoMovieSolidIntersectionWalk.ts; its surface is the 2 members listed and the text shows 1 other file naming it, mostly packages/engine (1), so no member is declared for a presumed future need.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.

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

For C targets, the first walk permits walkSteps*C steps with bounded failed halvings. Each reference chord uses one full step or at most walkSteps shortened attempts. An accepted shortened step decreases the remaining distance and regrows toward half the nominal chord. One initial and at most closingSteps equal walks each use walkPoints*C points.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the original previous iterate/tangent and accepted reference points; each secant candidate deliberately performs the same new equal walk.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Walk arrays and iterates are local; the returned law owns its prepared reference controls and the result owns one start tuple, with no global cache or task.
