# src/everyday/handGoals.ts#handGoals

## @evidence contracts/development/common.md#meaningful-documentation

States what a hand goal names and which of the contact and the rotation gives way.

## @evidence contracts/development/implementation.md#principled-implementation

The surface is the goal's contact, so the one resolver that fits the arm also keeps the surface on its point.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One goal per request.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No correction pass of its own: the resolver owns the re-aim, so the two cannot disagree.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per request and no posture solve.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to `AutoMovieMotionHumanArm.goal`, the owner of arm goals built from a hand surface.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
