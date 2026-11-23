# src/scene/dualQuaternionSkinning/dualQuaternionSkinningOf.ts#dualQuaternionSkinningOf

## @evidence contracts/development/implementation.md#principled-implementation

Reads the exact automovieDualQuaternionSkinning flag buildModel sets on a dual-quaternion SkinnedMesh and treats anything else as linear, the interface default.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lookup lets every guide pass decide the patch the way formationCycleOf lets it decide the cycle, without inspecting shader patch lists.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the builder's structural flag, not mesh names or material keys, so a pass cannot mistake a plain material for a skinning choice.

## @evidence contracts/development/common.md#meaningful-documentation

States the writer, why material-swapping passes need it and the trusted-handoff premise.

## @evidence contracts/development/implementation.md#efficient-algorithms

One property read in constant time with no allocation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the flag stored once at build instead of re-deriving it from the model per pass.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrows the object and retains nothing.
