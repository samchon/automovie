# src/index.ts#applyPose

## @evidence contracts/development/implementation.md#principled-implementation

Delegates admitted semantic/clinical joint angles and skeleton/rest-axis conventions to engine forward kinematics, writes resolved local quaternions by humanoid bone id, writes engine-resolved driven morph weights by exact target name, then applies root translation/rotation with unit scale; unmapped bones are reported and null root resets to identity rather than retaining the last pose.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Keeps pose and driver mathematics in resolvePose and resolveMorphTargetWeights and only copies their outputs into borrowed model bones, morph influences and root; caller-supplied partial bone mapping remains explicit instead of inventing missing joints.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Unit root scale is the engine rig convention, not a visual compensation; all mapped bones follow one FK result and missing bones are returned without fixture-specific tolerances or replaced solvers.

## @evidence contracts/development/common.md#meaningful-documentation

Gives local bone write, driven morph weights, optional clinical rest frames, unmapped-bone report, root reset and intentionally ignored root scale.

## @evidence contracts/development/implementation.md#efficient-algorithms

Visits the engine's resolved bone list once with map lookups and fixed quaternion writes, then traverses the model's O objects once to resolve each driven mesh's targets and once more to start the skinned meshes' pose revision in constant time each; dominant work is engine FK over the skeleton, with temporary resolved/skipped records proportional to bones rather than vertex count.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the model's existing Bone objects and one engine FK implementation; different pose/skeleton/axes/rest frames require fresh resolution and target state is rewritten rather than cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrows model/skeleton/pose and retains no solver or bone collection after return; skipped ids transfer to the caller and no GPU allocation or task is acquired.
