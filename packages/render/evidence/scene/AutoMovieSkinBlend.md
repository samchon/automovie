# src/scene/AutoMovieSkinBlend.ts#AutoMovieSkinBlend.dual

## @evidence contracts/development/implementation.md#principled-implementation

Kavan et al.'s DLB with the shader's pivot rule and the action p' = r p r* + vec(2 d r*).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One flat function the evaluation loop calls per vertex.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No fallback to linear blending.

## @evidence contracts/development/common.md#meaningful-documentation

States pivot, alignment, normalization and the direction case.

## @evidence contracts/development/implementation.md#efficient-algorithms

About a hundred flops, no allocation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the shared joint table.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Writes only into `out`.

# src/scene/AutoMovieSkinBlend.ts#AutoMovieSkinBlend.linear

## @evidence contracts/development/implementation.md#principled-implementation

The matrix blend Three's SkinnedMesh and its shader compute.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The linear counterpart of dual.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Weights are used as given, never renormalized; a zero weight contributes zero.

## @evidence contracts/development/common.md#meaningful-documentation

States the formula and output.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most four affine products, no allocation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the shared joint table.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Writes only into `out`.

# src/scene/AutoMovieSkinBlend.ts#AutoMovieSkinBlend.usedJoints

## @evidence contracts/development/implementation.md#principled-implementation

A slot with zero weight everywhere contributes nothing to either blend, so only these enter keys and bounds.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shared by the cache key and the joint-only sphere.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads the actual attributes, never the joint list's length.

## @evidence contracts/development/common.md#meaningful-documentation

States the order.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(V) once per geometry version.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The caller keeps the result per geometry version.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a caller-owned array.

# src/scene/AutoMovieSkinBlend.ts#AutoMovieSkinBlend.packed

## @evidence contracts/development/implementation.md#principled-implementation

Only a plain BufferAttribute's array equals its components.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Lets the evaluation loop index arrays directly when that is exact.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Interleaved or normalized attributes keep Three's decoding.

## @evidence contracts/development/common.md#meaningful-documentation

States when null is returned.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Borrows the attribute's array.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/scene/AutoMovieSkinBlend.ts#AutoMovieSkinBlend.versionOf

## @evidence contracts/development/implementation.md#principled-implementation

Three bumps these versions on every needsUpdate.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One read for both attribute kinds.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No content hashing stands in for the version.

## @evidence contracts/development/common.md#meaningful-documentation

States the interleaved case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Lets caches key on attribute writes.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
