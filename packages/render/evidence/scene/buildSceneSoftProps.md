# src/index.ts#buildSceneSoftProps

## @evidence contracts/development/common.md#meaningful-documentation

Documents the scene owner, film-time boundary, replacement and cleanup.

## @evidence contracts/development/implementation.md#principled-implementation

A map by performance subject updates one mesh per supplied frame. Common cloth projection owns Float32 geometry and material; a cord first acquires a tube through its particles and records those particles for placed collision checks.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit unique subjects and project their geometry before changing the scene, then update retained meshes and withdraw absent meshes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Accepts producer status verbatim and adds no solve or interpolation. An effectful mesh update can fail after another mesh has already advanced.

## @evidence contracts/development/implementation.md#efficient-algorithms

Map work is linear in incoming and currently mounted subjects, with additional projection work linear in their buffers.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A subject present in successive frames retains its projection and uses compatible buffers through buildSoftBodyObject.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds one projection per mounted subject. Dropped meshes are detached and independently retired, and explicit disposal closes updates and retires all remaining meshes.
