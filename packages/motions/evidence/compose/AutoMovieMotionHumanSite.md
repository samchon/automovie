# src/compose/AutoMovieMotionHumanSite.ts#AutoMovieMotionHumanSite.draw

## @evidence contracts/development/common.md#meaningful-documentation

States what is drawn, from what, and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Inverse-transform sampling of a categorical distribution: one uniform number scaled by the total weight, walked through the cumulative weights.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A check, one uniform draw and one cumulative walk.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A place outside the allowed ones cannot be returned; an empty set or a weight that is not positive is refused, never defaulted.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the allowed places, once per draw.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments; it coordinates no work.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/compose/AutoMovieMotionHumanSite.ts#AutoMovieMotionHumanSite.comfortable

## @evidence contracts/development/common.md#meaningful-documentation

States the posture the height is read in and its unit.

## @evidence contracts/development/implementation.md#principled-implementation

The body's own shoulder height less its upper arm: the hanging upper arm's elbow, where a level forearm holds the hand.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One subtraction of two measures.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No height is typed; both come from the body's measure.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its argument.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/compose/AutoMovieMotionHumanSite.ts#AutoMovieMotionHumanSite.grasp

## @evidence contracts/development/common.md#meaningful-documentation

States the rule, its inputs with their units and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

End-state comfort (Cohen and Rosenbaum 2004): the grasp is chosen for the end posture, the hand at its comfortable height, clamped to the part of the handle that can be held.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One check and one clamp.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A reversed band is refused, never swapped; the grasp never leaves the band.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
