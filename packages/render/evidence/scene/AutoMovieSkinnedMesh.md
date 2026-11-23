# src/scene/AutoMovieSkinnedMesh.ts#AutoMovieSkinnedMesh

## @evidence contracts/development/design.md#principled-representation

Overrides SkinnedMesh's documented applyBoneTransform, getVertexPosition, computeBoundingBox, computeBoundingSphere, raycast and copy with linear blend skinning or dual quaternion skinning (Kavan et al. 2008) over the attached-bind joint transforms the shader uses, with Shepperd's quaternion extraction, lowest-slot largest-weight pivot and hemisphere alignment identical to dualQuaternionSkinningVertex; morph targets apply first through Three's own Mesh.getVertexPosition. Rigidity of the dual quaternion blend premises a uniform part scale, which model admission enforces.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One subclass owns the CPU evaluation every query consumer reads; buildModel and the Human skin instance select it with the skin's method and pose writers invalidate it, while the GPU blend stays in the shader patch.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Extends Three through its documented override points instead of replacing prototype methods or globals, and pads bounds by a stated float32 rounding bound rather than disabling frustum culling.

## @evidence contracts/development/common.md#meaningful-documentation

States the operator order, frames, the invalidation duty, the cache key, the bound padding and the CPU/GPU precision.

# src/scene/AutoMovieSkinnedMesh.ts#AutoMovieSkinnedMesh.prototype.tolerance

## @evidence contracts/development/implementation.md#principled-implementation

Scales the float32 unit roundoff 2^-24 by 64 operations over the largest posed coordinate, the magnitude every rounding is relative to.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One stated bound serves box padding, sphere padding and callers comparing CPU and GPU results.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A rounding bound, not a fitted margin; it never grows to hide a deformation mismatch.

## @evidence contracts/development/common.md#meaningful-documentation

States the unit, frame and derivation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant after the evaluation, which records the largest coordinate.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the current key's evaluation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing beyond the cache.

# src/scene/AutoMovieSkinnedMesh.ts#AutoMovieSkinnedMesh.prototype.invalidatePose

## @evidence contracts/development/implementation.md#principled-implementation

Marks the key for checking and clears Three's bounds, which every Three consumer recomputes when null.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The one revision step every pose writer takes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is recomputed eagerly, so a pose nobody queries costs nothing, and an unchanged key is proven equal before the cache is kept.

## @evidence contracts/development/common.md#meaningful-documentation

States when to call it.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Keeps the cache for a key that turns out unchanged.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Releases only the two bound objects.

# src/scene/AutoMovieSkinnedMesh.ts#AutoMovieSkinnedMesh.clearBounds

## @evidence contracts/development/implementation.md#principled-implementation

Writes null, the value Three's own SkinnedMesh constructor starts with and its consumers test for.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One owner of the typings gap, shared by invalidatePose and the foreign-mesh revision.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The widening covers only these two properties' runtime type; no method is replaced.

## @evidence contracts/development/common.md#meaningful-documentation

States the runtime contract and the typings disagreement.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Consumers recompute once on next read.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Releases the two bound objects.

# src/scene/AutoMovieSkinnedMesh.ts#AutoMovieSkinnedMesh.prototype.getVertexPosition

## @evidence contracts/development/implementation.md#principled-implementation

Brings the cache to the current key, then reads it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The one point query raycast, bounds and Box3 precise mode share.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A cache of another geometry or an invalidated pose is never read unchecked.

## @evidence contracts/development/common.md#meaningful-documentation

States the order and frame.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time with a current key.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every query of one key shares one evaluation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Writes into the caller's vector.

# src/scene/AutoMovieSkinnedMesh.ts#AutoMovieSkinnedMesh.prototype.applyBoneTransform

## @evidence contracts/development/implementation.md#principled-implementation

Linear defers to Three; dual quaternion builds the vertex's four joint dual quaternions from the current bone matrices and blends them as the shader does, rotating a direction (w = 0) without translation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Keeps Three's documented overloads so its own callers keep working.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No linear fallback for a dual-quaternion skin.

## @evidence contracts/development/common.md#meaningful-documentation

States both methods and the direction case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Four joint transforms and one blend per call.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Batch consumers read the cache instead of calling this per vertex.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Uses module scratch only.

# src/scene/AutoMovieSkinnedMesh.ts#AutoMovieSkinnedMesh.prototype.computeBoundingBox

## @evidence contracts/development/implementation.md#principled-implementation

Copies the evaluated extent of the cached posed positions and pads every side by the GPU rounding bound.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The exact tier, read by framing, Box3 queries and the raycast box test.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Never the rest or linear box of a dual-quaternion skin.

## @evidence contracts/development/common.md#meaningful-documentation

States frame and padding.

## @evidence contracts/development/implementation.md#efficient-algorithms

One evaluation under a changed key, then constant.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the evaluated extent and the Box3 object.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains one Box3.

# src/scene/AutoMovieSkinnedMesh.ts#AutoMovieSkinnedMesh.prototype.computeBoundingSphere

## @evidence contracts/development/implementation.md#principled-implementation

Delegates the proven joint-only bound to AutoMovieSkinPose.enclose and falls back to the exact cache for a live morph or joints whose rotations disagree too much for a useful bound.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Frame-rate consumers read this tier; the exact box serves framing and picking.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Never the rest or linear sphere of a dual-quaternion skin and never an always-visible flag.

## @evidence contracts/development/common.md#meaningful-documentation

States the two tiers and the padding.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(U^2) without vertices, or the exact O(V) evaluation on fallback.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the rest sphere per geometry version and the Sphere object.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains one Sphere.

# src/scene/AutoMovieSkinnedMesh.ts#AutoMovieSkinnedMesh.prototype.raycast

## @evidence contracts/development/implementation.md#principled-implementation

Tests the safe sphere, computes the exact box only for a ray that meets it, and lets Three's own box and triangle tests read the posed vertices through getVertexPosition.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Picking reads the same result bounds and rendering do.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No linear or rest triangles for a dual-quaternion skin.

## @evidence contracts/development/common.md#meaningful-documentation

States what is tested.

## @evidence contracts/development/implementation.md#efficient-algorithms

A missed sphere costs O(U^2) at most; a met one at most one evaluation, then Three's O(T) triangle test over cached vertices.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every ray of one key shares one evaluation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Appends to the caller's intersections only.

# src/scene/AutoMovieSkinnedMesh.ts#AutoMovieSkinnedMesh.prototype.copy

## @evidence contracts/development/implementation.md#principled-implementation

Copies the method beside SkinnedMesh.copy so clones such as outline shells and Human instances blend as the source does.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Mirrors Three's copy contract.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Shares no cache between meshes.

## @evidence contracts/development/common.md#meaningful-documentation

States what is copied.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant beyond Three's copy.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A clone evaluates its own key.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates no cache until queried.
