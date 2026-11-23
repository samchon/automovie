# src/scene/collectAutoMovieOwnedResources.ts#collectAutoMovieOwnedResources

## @evidence contracts/development/implementation.md#principled-implementation

Snapshots geometry/visible/custom-shadow material identities and skinned-mesh skeletons (whose dispose releases the renderer's bone texture) from actual mesh subclasses before disposal can mutate the subtree, optionally collecting direct native texture slots; the caller must own those roles, and shader-uniform/producer-owned textures remain outside this collector.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Returns a deduplicated retirement population without executing disposal or inferring ownership from attachment; asynchronous/failure-aware retirement stays with its resource owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

ownTextures is an explicit decoded-subtree ownership decision, not a fixture-name inference; actual object identity dedup avoids duplicate calls and no foreign disposal method is replaced.

## @evidence contracts/development/common.md#meaningful-documentation

Gives pre-disposal snapshot purpose, standard/custom-shadow roles, optional texture ownership, borrowed-source prohibition and uniform-texture exclusion.

## @evidence contracts/development/implementation.md#efficient-algorithms

Traverses O subtree nodes and mesh material slots with identity Sets, then optionally scans direct enumerable fields of unique materials; time/storage follow actual unique geometry/material/texture resources, not instance-member count or pixel dimensions.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Deduplicates resources shared by multiple meshes in one snapshot; different mutable subtrees/ownership roles require a fresh collection rather than an attachment-only cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Acquires no resource ownership or task and transfers snapshot references to the caller; its temporary Sets die on return, while the caller must preserve failed/indeterminate owned resources through supported retirement.
