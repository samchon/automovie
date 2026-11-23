# src/pose/IAutoMovieSkeletonTopology.ts#IAutoMovieSkeletonTopology

## @evidence contracts/development/design.md#principled-representation

A parent-to-children adjacency list plus the set reached by a depth-first walk from the null-parent roots, which is exactly the order and population the forward-kinematics walk needs; bones on a cycle or under a missing parent are never reached.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Both facts every walk needs, children and reachability, in one readonly record that `resolvePose`, `reachableBoneNames` and the validators accept as an optional argument.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No cache is hidden behind the skeleton object; reuse is an explicit argument, so a mutated skeleton cannot be resolved against a stale index unless the caller passes one.

## @evidence contracts/development/common.md#meaningful-documentation

States its builder and consumers, when to reuse it, that it aliases the skeleton's bones and goes stale on mutation, and what each member keys or contains.
