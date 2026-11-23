# src/film/gatePerformShotBlocking.ts#gatePerformShotBlocking

## @evidence contracts/development/implementation.md#principled-implementation

Compares the plan and the realization field by field, with anchor coverage decided by interval containment over the shared action span and the camera intent by the earliest frame move, which is the move the intent describes; the tolerances absorb floating start arithmetic only.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The coherence check between two pipeline stages in one place, reading spans and actors through the shared helpers so an anchor is judged over the same interval the overlap gate uses.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every anchor and actor is held to the same rule; a missing frame move is accepted only for a `static` intent, which a locked-off camera does realize, and never for a moving one.

## @evidence contracts/development/common.md#meaningful-documentation

States each coherence rule with its tolerance, the static-intent exception, which frame move is compared and why the list must be sorted, and where violations land.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each anchor can scan every stage action and its actor list for coverage, so cost grows with anchors times the total inspected action/member population. Beat, duration and camera comparisons add fixed local work, while diagnostic text scales with represented values.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One comparison of one blocking with one performance per call.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Pushes violations into the shared collector and retains nothing.
