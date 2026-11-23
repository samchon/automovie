# src/physics/readXpbdManifolds.ts#readXpbdManifolds

## @evidence contracts/development/common.md#meaningful-documentation

States which pairs are reported, the normal's direction, each point's position, separation and impulse with units, and the order.

## @evidence contracts/development/implementation.md#principled-implementation

Each point's impulse is the momentum the step's position and velocity passes transferred, so a reader sees the step's real load; the witness midpoint is the two bodies' contact points at their current poses.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass that opens a manifold whenever the pair index changes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Sensor pairs are left to the world's intersections; no pair has its own rule.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the step's contacts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Built on demand from the retained contacts; a caller reading twice gets equal fresh records.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh records; retains nothing.
