# src/kinematics/AutoMovieHumanoidNeutralBounds.ts#AutoMovieHumanoidNeutralBounds.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

Names the private producer identity and stable geometry lifetime without exposing numeric storage.

## @evidence contracts/development/design.md#principled-representation

A private unique-symbol member prevents structural construction, and runtime weak ownership validates provenance.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the optional internal derivation arguments carry this handle; prepare, read and release own all metadata.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The handle contains neither caller-supplied bounds nor an unchecked ready flag; runtime ownership remains required even after a type assertion.

# src/kinematics/AutoMovieHumanoidNeutralBounds.ts#AutoMovieHumanoidNeutralBounds.prepare

## @evidence contracts/development/common.md#meaningful-documentation

Defines unchanged geometry, lazy calculation and release obligations.

## @evidence contracts/development/implementation.md#principled-implementation

Snapshots actual segment identities; only a later read delegates the ordinary exact bounds of that segment's original neutral frame and shapes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One genuine handle owns its profile, admitted segment set and numeric bound map; preparation runs no shape calculation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No numeric validation is relocated or bypassed; shape reads occur only at their original consumer's first bound observation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Preparation takes O(S) identity indexing and no hull rotations for S profile entries.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only exact segment identities from this unchanged profile can share their ordinary neutral bounds within the epoch.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The weak live entry retains the borrowed profile, O(S) identities and at most S numeric bounds until explicit release; it retains no queries, poses or results from another epoch.

# src/kinematics/AutoMovieHumanoidNeutralBounds.ts#AutoMovieHumanoidNeutralBounds.read

## @evidence contracts/development/common.md#meaningful-documentation

Ordinary reads freshly calculate neutral geometry; an optional handle additionally requires live matching-source admission. Both return detached bounds.

## @evidence contracts/development/implementation.md#principled-implementation

Unions every original shape bound in original shape and XYZ order using the same Math.min/Math.max expressions as measurement and surface rays.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One private calculate routine owns the original union for standalone and scoped consumers. Prepared admission precedes lazy per-segment calculation, then returns copies of its six retained coordinates.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Supplied handles must be live and match the profile and segment; omission calculates fresh. Both paths preserve all colliders, extrema, empty/NaN behavior and physical owner refusals.

## @evidence contracts/development/implementation.md#efficient-algorithms

Ordinary/first prepared observations cost their shape bounds, O(V) for hull vertices. Prepared repeats use constant lookup and copy six coordinates instead of repeating rotations; caller-local maps still share repeated standalone observations.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Handle ownership, exact profile/segment identities and the explicit unchanged synchronous epoch establish the reuse premise; no mutable global profile-identity cache is introduced.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only six numbers per observed segment enter the operation map. Each caller owns detached min/max vectors; release drops the profile and all entries, and reads after release throw.

# src/kinematics/AutoMovieHumanoidNeutralBounds.ts#AutoMovieHumanoidNeutralBounds.release

## @evidence contracts/development/common.md#meaningful-documentation

States idempotent release and subsequent-read refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Deletes the genuine handle's sole weak state entry, ending ownership of all fixed source and numeric prerequisites.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One deletion owns cleanup on both successful derivation and its finally error path.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Release cannot make an unrelated or forged handle readable; absent handles remain absent.

## @evidence contracts/development/implementation.md#efficient-algorithms

One weak-map deletion performs constant explicit work; normal garbage collection reclaims released maps and source references.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

This is the single cleanup owner used by withSurfaces in finally; no second invalidation population exists.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Removes all epoch-owned source references and numeric bounds; no returned vector aliases the deleted state.
