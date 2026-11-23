# src/soft/arrangePlantingCluster.ts#arrangePlantingCluster

## @evidence contracts/development/implementation.md#principled-implementation

Seed/slot/attempt keyed candidates and a nine-cell spacing test preserve sequential acceptance. The grid argument assumes representable cell indices and finite coordinate squares; admitted huge finite inputs can violate these numeric premises, so exhaustive equivalence is not universal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Arrangement owns placement and spacing while growPlanting owns recipe-local geometry; one canonical planting yaw owner serves both leaf roll and member yaw.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Failed slots are counted, not squeezed into a neighbour; zero spacing deliberately skips the grid, and no claim of constant bucket occupancy or arbitrary-finite numeric safety hides remaining limitations.

## @evidence contracts/development/common.md#meaningful-documentation

States slot order, rejected members, full TRS, origin-only bounds and grid precision premises.

## @evidence contracts/development/implementation.md#efficient-algorithms

For N slots and A attempts, fixed nine-cell lookup still costs each visited bucket population; worst-case O(N*A*N) comparisons and O(N) placement/grid storage, with no unmeasured universal speedup claim.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Accepted origins populate one per-call grid reused across later candidates; slot/path seeded yaw is shared code, while mutable cluster inputs invalidate the entire arrangement and have no retained cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Placements and bounds are fresh caller-owned records; the grid and intermediate origin list are discarded, with no instances or GPU handles retained.
