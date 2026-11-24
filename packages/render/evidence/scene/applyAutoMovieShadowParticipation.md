# src/scene/applyAutoMovieShadowParticipation.ts#applyAutoMovieShadowParticipation

## @evidence contracts/development/implementation.md#principled-implementation

Marks actual mesh/skinned/instanced geometry as caster/receiver except descendants of the reserved semantic-space group; declared support patches have no physical volume and are structural-guide geometry, while renderer/light owners separately enable actual shadow rendering. A mesh with a transparent (blended) material receives but does not cast, because three.js shadow maps ignore opacity and would draw it as an opaque occluder of its own light.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns object participation once for built and manually assembled scene hosts, keeping light shadow configuration and renderer policy with their own declarations.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reserved SPACE_GROUP_NAME is a structural viewer identity rather than a fixture name; this uniformly overwrites mesh flags by role and does not emulate a shadow with dark geometry or replace Three internals.

## @evidence contracts/development/common.md#meaningful-documentation

Describes model/semantic-ground distinction, mesh subclasses and the separate enabled-renderer/casting-light prerequisites; flags alone do not prove a visible shadow.

## @evidence contracts/development/implementation.md#efficient-algorithms

Traverses the scene to find reserved groups, visits their descendants into an identity Set and traverses meshes again for constant-time membership; time is O(objects plus reserved descendant visits), potentially repeated for nested reserved groups, and temporary space is linear in semantic-ground objects.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the reserved shared naming contract and one ground Set within a call; scene hierarchy/roles can change, so no cross-call participation cache is retained.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrows scene objects, retains only temporary group/ground collections and acquires no shadow map or task; persistent boolean flags remain with each host-owned object.
