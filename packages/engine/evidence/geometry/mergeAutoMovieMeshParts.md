# src/geometry/mergeAutoMovieMeshParts.ts#mergeAutoMovieMeshParts

## @evidence contracts/development/implementation.md#principled-implementation

Each group's start is the running sum of the earlier members' index counts, which is exactly the offset at which `mergeAutoMovieMeshes` appends that member's rebased indices, so a group addresses precisely its member's triangles.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Only identity admission, placement and group bookkeeping live here; concatenation and attribute rules stay in `mergeAutoMovieMeshes` and the transform rules in `transformAutoMovieMesh`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Index buffers are admitted per part with the part's id in the diagnostic before placement, instead of letting a later stage refuse an anonymous member.

## @evidence contracts/development/common.md#meaningful-documentation

States what groups are for, their order and addressing, the inherited coordinate rules with the reuse pitfall and its remedy, and every refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the total vertices and indices: one id pass, one index admission and at most one transform per part, then the linear merge.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call assembles one set of parts; an untransformed member is passed to the merge by reference rather than copied.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns the merged mesh and one small group record per part; transformed member meshes are temporaries released after the merge copies them.
