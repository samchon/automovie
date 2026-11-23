# src/architecture/builtEnvironmentEnvelopeCorners.ts#builtEnvironmentEnvelopeCorners

## @evidence contracts/development/implementation.md#principled-implementation

Places the envelope with `builtEnvironmentEnvelopeFaces` and pairs its facades with `builtEnvelopeFaceCorners`, whose proximity and side tests read only the placed geometry.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The environment-level entry point over the face-level pairing, which the census calls directly with faces it already holds, so the pairing rule has one owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no building or boundary and adds nothing to the two shared steps; the unowned-space refusal passes through from the face query.

## @evidence contracts/development/common.md#meaningful-documentation

States the meeting rule and its slack, the exterior and reentrant reading, the id, position and normal of a corner, the sort, and the throw.

## @evidence contracts/development/implementation.md#efficient-algorithms

Pays full `builtEnvironmentEnvelopeFaces` cost, including space indexing, distinct-space ownership lookups, containment probes and face sorting. Pairing adds facade-pair scans times their vertex-count products and sorting of the returned corners; it is not solely quadratic in facade count when outline sizes vary.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Answers one environment per call and keeps nothing; a caller that already holds the faces calls `builtEnvelopeFaceCorners` instead of placing them again.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The placed faces are dropped on return; the caller owns the returned corners.
