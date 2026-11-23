# src/scene/dualQuaternionSkinning/dualQuaternionSkinningVertex.ts#dualQuaternionSkinningVertex

## @evidence contracts/development/implementation.md#principled-implementation

Dual quaternion skinning (Kavan et al. 2008) over joint transforms conjugated by Three's attached bind matrices, which cancels the world placement exactly; rigidity premises a uniform part scale, which model admission enforces, and Shepperd's branches keep the matrix-to-quaternion division away from zero.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Source transformation only: three chunk replacements plus helper functions beside Three's skinning parameters, while registration and program keys stay with the patch owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Missing required chunks throw instead of silently drawing linear skinning; the skinning normal chunk is optional only because depth shaders legitimately omit it.

## @evidence contracts/development/common.md#meaningful-documentation

States the matrix identity that cancels the placement, the blend, the pivot rule, the frame of the result, the shared blend across chunks and the refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

A fixed number of string replacements over S shader bytes; on the GPU each skinned vertex does eight 4x4 products and four matrix-to-quaternion conversions, constant per vertex.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The blended dual quaternion is computed once per vertex and shared by the normal, tangent and position chunks; identical source text lets the material's stable key reuse one program.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only strings are created and returned; no uniform, texture or program is acquired.
