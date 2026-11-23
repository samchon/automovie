# src/kinematics/composePoseFrames.ts#composePoseFrames

## @evidence contracts/development/implementation.md#principled-implementation

Forward kinematics of a rooted tree in parent-first order: local = rest x articulation, world = parent x local, position = parent position + parent-rotated offset, each by the Hamilton product and the `v + w t + q x t` rotation with `t = 2 (q x v)` the record forms use, expression for expression.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop over the rows. Admission, the choice of articulations and the making of public records belong to the callers; the companion builds the tables, the workspace and one bone's record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No bone, side or rig is named; no component is normalized, clamped or repaired; a rig the tables were not built from is not detected, which is the caller's premise.

## @evidence contracts/development/implementation.md#efficient-algorithms

B bones cost B iterations of two quaternion products and one vector rotation on typed arrays: no name lookup, recursion, revision bookkeeping or allocation. A whole humanoid is composed in less time than the dependency rows of a few of its bones were compared in. A caller that reads a few bones composes only the prefix of rows up to the deepest of them and extends it when a later read asks further.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A parent's frame is read from the same workspace by all its children. The rig's tables are built once per node list and kept weakly.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Writes only the caller's workspace and retains nothing; the tables live in a weak map keyed by the rig's node list and go with it.

## @evidence contracts/development/common.md#meaningful-documentation

States the recurrence, the row order it relies on, the root, what is not read or admitted, the units and where the result goes.
