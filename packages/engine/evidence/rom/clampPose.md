# src/rom/clampPose.ts#clampPose

## @evidence contracts/development/implementation.md#principled-implementation

Map joints in source order through the existing one-joint clamp, indexed by the first matching skeleton bone to preserve find semantics; swing-twist axes retain skeletonJointAxes' last-declared precedence and unconstrained joints retain identity. Members: the prepared projection carries the one-joint clamp it maps and its angle-taking form (`IPrepared.joints`, `IPrepared.values`), made with it and read directly, with no lookup.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The single-call entry delegates to prepare, whose shared joint-clamp factory owns first-bone indexing and lazy frame/constraint lookup. joints lends that actual factory's same one-joint callable to a matching operation; numerical projection remains in clampJointRom and every pose wrapper and joint array is fresh.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No joint is invented/dropped and root is not repaired; skeleton identity admission and unrestricted multi-turn cone correctness remain outside this mapper. Members: the prepared projection carries the one-joint clamp it maps and its angle-taking form (`IPrepared.joints`, `IPrepared.values`), made with it and read directly, with no lookup.

## @evidence contracts/development/implementation.md#efficient-algorithms

For J joints and B bones, first-bone indexing and at most one axis merge plus per-name clamp lookup cost O(B+J) metadata work, followed by the same numerical projection per joint; temporary storage is O(B+D) for D distinct joint names, plus O(J) output. Members: the prepared projection carries the one-joint clamp it maps and its angle-taking form (`IPrepared.joints`, `IPrepared.values`), made with it and read directly, with no lookup.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses each distinct bone's constraint and frame only within this synchronous pure-data pose operation; a later call rebuilds from current skeleton contents, while repeated same-name joints still receive separate actual projections. Members: the prepared projection carries the one-joint clamp it maps and its angle-taking form (`IPrepared.joints`, `IPrepared.values`), made with it and read directly, with no lookup.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The index, optional axes table and at most D clamp closures are operation-local and released on return or failure; the caller owns wrapper/array/new joints and borrows root/unconstrained joints, with no global skeleton cache, handle or task. Members: the prepared projection carries the one-joint clamp it maps and its angle-taking form (`IPrepared.joints`, `IPrepared.values`), made with it and read directly, with no lookup.

## @evidence contracts/development/common.md#meaningful-documentation

States new wrapper/array, borrowed root/unconstrained joints and admission limits; implementation answers identify first-bone constraint precedence and current per-call rig metadata. Members: the prepared projection carries the one-joint clamp it maps and its angle-taking form (`IPrepared.joints`, `IPrepared.values`), made with it and read directly, with no lookup.
