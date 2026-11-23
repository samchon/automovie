# src/index.ts#applyObjectMotion

## @evidence contracts/development/implementation.md#principled-implementation

Uses the engine's sampleClip interpolation and applies its admitted node vectors to Three local transforms or indexed morph influences; clips must satisfy engine widths/quaternion conventions and the target parent frame must match their coordinates. Absent channels retain host state rather than restoring a rest pose.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This single-clip entry delegates to the same sampled-channel writer as the sequence entry, so transform and morph semantics have one owner; it does not allocate or own a scene.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Resolves each authored node id through the supplied scene lookup and skips unresolved/non-node channels by contract; no fixture ids, substituted methods or numeric compensations select behavior.

## @evidence contracts/development/common.md#meaningful-documentation

Documents seconds, world-space clip intent, the four applied node paths, missing-node tolerance, unchanged absent channels and the shared writer's current exhaustiveness limitation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Sampling scans clip channels and their engine key lookup; writing is linear in sampled channels plus descendant meshes for each weights channel, with the engine sample table as request-local storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the shared writer while sampling independently for the supplied clip/time; mutable scene targets and partial-channel effects make result caching unsafe here.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrows clip and resolved scene objects, retains no handles after the call and transfers no resource ownership; only temporary sample data and morph traversal callbacks are created.
