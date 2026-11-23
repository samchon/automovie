# src/soft/projectSoftBodyContacts.ts#projectSoftBodyContacts

## @evidence contracts/development/implementation.md#principled-implementation

Half-spaces, spheres, axis-aligned boxes and capsules use their existing analytic escape predicates in declaration order. This is discrete endpoint projection, not continuous collision detection or simultaneous nonpenetration proof; later projection may reenter an earlier collider.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Both integration paths share one contact phase and its geometric owners, while boundary admission and anchored-particle exclusion remain with their callers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The original capsule-axis fallback and strict box tie ordering are preserved, including their degenerate symmetry limitations; no inferred body collider or hidden self-collision solve is added.

## @evidence contracts/development/common.md#meaningful-documentation

States contact ordering, counter meaning and discrete-projection limitations.

## @evidence contracts/development/implementation.md#efficient-algorithms

For C static colliders and B resolved capsules, one particle costs O(C+B) time with fixed scalar/short-array temporaries; no mesh search or contact-history structure is built.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Static and moving solves reuse identical projection code but reevaluate each particle's current coordinates; contact results cannot be cached across moved positions or boundaries.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller-owned predicted triple is updated in place, collider rows are read only, and only the updated count survives the call.
