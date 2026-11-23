# src/skinning/skinAutoMovieMesh.ts#skinAutoMovieMesh

## @evidence contracts/development/implementation.md#principled-implementation

Linear blend skinning and dual quaternion skinning (Kavan et al. 2008) over per-joint rigid transforms `P R^-1`; rigidity holds because resolvePose composes rotations and translations only, and dual quaternion blending premises influences within 180 degrees of the pivot, which is the documented flip limit. Positions are blended in double precision while the shader uses single precision, so the two agree to float rounding, not bit for bit.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns both blends so a measurement reads the formula the render uses; the joint transforms are computed once per joint and the method switch is per call, not per vertex.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing skin or joint throws instead of leaving vertices at rest, and no joint, mesh or weight pattern is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

States both formulas, the pivot rule, the morph-before-skin order, the input and output frames, the part-transform premise, the throw conditions and each parameter's source.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(J + T V) for J skin joints, V vertices and T weighted targets: one transform per joint, one delta pass per weighted target, then four influences per vertex with constant temporary storage beyond the returned array.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Joint transforms are shared by every vertex of the call; a different pose needs a new call, and nothing is cached across calls because bone lists carry no identity key.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the per-joint tables and the morphed rest copy, 3V numbers, are local, and the returned array, 3V numbers, belongs to the caller.
