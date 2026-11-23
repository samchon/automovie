# src/environments/placeEnvironmentSpace.ts#placeEnvironmentSpace

## @evidence contracts/development/implementation.md#principled-implementation

An upright rigid pose maps XZ rings by yaw and translation and preserves holes. Legacy ramp anchors are points under that same pose. A plane's XZ gradient rotates with its footprint, and translating the lattice and its heights retains the bilinear rule.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reuses validateSpace for source geometry and AutoMovieArchetypeFrame for placement. The one height dispatcher owns which transform preserves each height representation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refuses tilt and a yawed sampled lattice instead of discarding orientation or changing its interpolation law. The world-space contribution path can place an explicitly sampled lattice.

## @evidence contracts/development/implementation.md#efficient-algorithms

Aside from canonical space validation, placement visits each ring point, walkable id and retained lattice sample once. A plane case rotates one gradient and allocates no samples.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The helper produces fresh world geometry from one authored space and pose and holds no lookup cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Only the returned support and its arrays survive the call and no external resources are acquired.

## @evidence contracts/development/common.md#meaningful-documentation

States the spaces, metre units, identity and rotation restrictions.
