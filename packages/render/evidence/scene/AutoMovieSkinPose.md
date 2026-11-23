# src/scene/AutoMovieSkinPose.ts#AutoMovieSkinPose

## @evidence contracts/development/design.md#principled-representation

Morphs through Three's own Mesh.getVertexPosition, then blends over K_j = bindMatrixInverse * boneWorld_j * boneInverse_j * bindMatrix as the shader does; the sphere follows from the bi-invariance of dual quaternion blending and the convexity of linear blending.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Separates cached state and passes from the mesh's Three overrides, and the arithmetic from both, keeping each file one responsibility.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The key is rebuilt from current matrices, never trusted from an invalidation; an unbounded sphere falls back to the exact one.

## @evidence contracts/development/common.md#meaningful-documentation

States what is held and where the derivations are documented.

# src/scene/AutoMovieSkinPose.ts#AutoMovieSkinPose.prototype.invalidate

## @evidence contracts/development/implementation.md#principled-implementation

The next query rebuilds the key from current matrices.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The mesh's invalidatePose delegates here.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Recomputes nothing eagerly.

## @evidence contracts/development/common.md#meaningful-documentation

States the effect.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Keeps the cache for an unchanged key.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Releases nothing.

# src/scene/AutoMovieSkinPose.ts#AutoMovieSkinPose.prototype.reset

## @evidence contracts/development/implementation.md#principled-implementation

Clears the geometry key so the next query evaluates.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Used by the mesh's copy.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No cache is shared between meshes.

## @evidence contracts/development/common.md#meaningful-documentation

States the effect.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Nothing is reused afterwards.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Keeps the allocated arrays for reuse.

# src/scene/AutoMovieSkinPose.ts#AutoMovieSkinPose.prototype.evaluate

## @evidence contracts/development/implementation.md#principled-implementation

Rebuilds the key from attribute versions, morph influences and each weighted joint's K_j, then on a change morphs and blends every vertex by the skin's method and records extent, radius and largest coordinate.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The one pass every vertex consumer shares.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Equality is exact; a stale cache of another geometry is never kept.

## @evidence contracts/development/common.md#meaningful-documentation

States the key and the outputs.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(U) for an unchanged key, otherwise two O(V) passes over typed arrays.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every query of one key shares the pass.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Reallocates the cache and key only when their sizes change.

# src/scene/AutoMovieSkinPose.ts#AutoMovieSkinPose.prototype.enclose

## @evidence contracts/development/implementation.md#principled-implementation

With the rest sphere (c, r): DQ blending commutes with rigid frame changes, so each posed vertex lies within r of the blended image of c, and that image lies within max_k |K_k c - K_a c| / m of the anchor's, m = least |q_k . q_l| bounding the aligned blend's rotation norm from below because the weights sum to one; linear blending is a convex combination of rigid images, m = 1. Padded by the float32 bound.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The frame-rate tier of the mesh's bounds.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A proven bound, not a fitted margin; MINIMUM_ALIGNMENT only chooses the exact sphere instead of a looser bound.

## @evidence contracts/development/common.md#meaningful-documentation

States the bound and the fallbacks.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(U^2) per call; the rest sphere costs O(V) once per geometry version.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Keeps the rest sphere and weighted slots per geometry and attribute versions.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Writes into the caller's sphere.

# src/scene/AutoMovieSkinPose.ts#AutoMovieSkinPose.joint

## @evidence contracts/development/implementation.md#principled-implementation

K_j as the shader forms it from Three's boneMatrices and attached bind, rotation by Shepperd's method in Three's branch order, dual part 0.5 (t, 0) q.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One writer of table entries for the key, the sphere and single queries.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing bone or inverse reads identity, as Three's Skeleton does.

## @evidence contracts/development/common.md#meaningful-documentation

States the entry layout.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three 4x4 products and one quaternion extraction.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Callers write each joint once per query.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Uses module scratch only.

# src/scene/AutoMovieSkinPose.ts#AutoMovieSkinPose.IMesh

## @evidence contracts/development/design.md#principled-representation

The SkinnedMesh members the shader's blend depends on, plus the blend method.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Avoids a circular class dependency on the mesh.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Read-only use.

## @evidence contracts/development/common.md#meaningful-documentation

Names each dependency.
