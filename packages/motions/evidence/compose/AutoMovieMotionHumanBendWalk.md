# src/compose/AutoMovieMotionHumanBendWalk.ts#AutoMovieMotionHumanBendWalk.ISolved

## @evidence contracts/development/common.md#meaningful-documentation

Names the search's own result.

## @evidence contracts/development/design.md#principled-representation

The search's candidate and seed, unchanged.

## @evidence contracts/development/design.md#minimal-and-owned-surface

An alias of the search's result.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No member is added.

# src/compose/AutoMovieMotionHumanBendWalk.ts#AutoMovieMotionHumanBendWalk.walk

## @evidence contracts/development/common.md#meaningful-documentation

States the walk, its bound and the absent result.

## @evidence contracts/development/implementation.md#principled-implementation

Numerical continuation: the search's near refinement, restarted at its result while that result sits at the refinement's edge, so it follows the minimum it started beside.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One preparation, then one loop of continued searches.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A candidate outside the allowed places is not returned; the walk is bounded by one turn of steps.

## @evidence contracts/development/implementation.md#efficient-algorithms

One chain preparation a walk, then a refinement's probes a step walked, at most 360 / STEP steps.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every step searches the one request, so they share its prepared chain.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/compose/AutoMovieMotionHumanBendWalk.ts#AutoMovieMotionHumanBendWalk.next

## @evidence contracts/development/common.md#meaningful-documentation

States the two modes, the turn alignment and the absent result.

## @evidence contracts/development/implementation.md#principled-implementation

Continuation where it stays allowed, the cold sweep otherwise (the search's multiple initialisation), its swivel taken modulo a turn to the seed's.

## @evidence contracts/development/implementation.md#clear-and-simple-structure `walk`, then the cold search.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A cold candidate outside the allowed places is not returned.

## @evidence contracts/development/implementation.md#efficient-algorithms

One chain preparation, then a walk's refinements or one cold sweep.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The walk and the cold search share the request's one prepared chain.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
