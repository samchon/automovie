# src/posture/prepareHumanPoseResolution.ts#prepareHumanPoseResolution

## @evidence contracts/development/common.md#meaningful-documentation

States the lent source forms (`IAutoMoviePoseResolution.ISource`), the fresh native default and synchronous ownership. `read` resolves one source to its reader; `isNativeSource` states the engine's own check of that reader.

## @evidence contracts/development/implementation.md#principled-implementation

Every demand of one evaluation returns the same reader: the lent one, the one its getter returns, or one fresh `preparePoseResolution` reader.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

`read` owns the one dispatch over the interface's source union; the getter and `isNativeSource` read through it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not memoize a pose, numerical callback, fit, goal, near seed or query result. The source provides only the parent's exact FK workspace; all fits remain evaluated normally.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work: one dispatch, at most one reader, one closure.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A lent reader is shared with the lending evaluation, so exact unchanged FK dependencies are not recomputed.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The synchronous owner releases the getter and its one reader. Nothing else is stored: no registry, pose, numerical history, retained plan/body entry, task or handle.
