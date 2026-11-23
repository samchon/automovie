# src/scene/applyDepthMode.ts#applyDepthMode

## @evidence contracts/development/implementation.md#principled-implementation

Shades clamp(1-viewZ/range,0,1) after native morph targets, then native or dual-quaternion skinning, instancing and shared formation-cycle injection, the operator order of the beauty pass, using camera-space metre depth rather than near/far normalization; range must be finite/positive and custom deformation not represented by these chunks is unsupported.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns the depth shader/background while the shared override helper owns mesh selection, each mesh's replacement and cycle patch, and restoration bookkeeping.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses actual deformed view-space vertices and one declared scene range without fixture bounds or camera-specific depth rescaling; no foreign method/prototype is replaced.

## @evidence contracts/development/common.md#meaningful-documentation

States the metric depth mapping, black far background, supported native skinning, clipping by a plane given to the material, range premise and returned restoration ownership.

## @evidence contracts/development/implementation.md#efficient-algorithms

Shared override collects M scene meshes and calls the factory for each, producing M owned shader materials; CPU installation/restore is linear in selected meshes, and shader work is constant per vertex/fragment with no screen-space postprocess.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each mesh receives its own override and borrows its actual cycle uniforms through the shared patcher; Three may share equivalent programs, but material objects and separate pass restoration remain independent.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Temporarily borrows original materials/background, owns override shader materials until memoized restore, and restores background even when another restore operation throws; installation failure after background change still lacks an outer rollback here.
