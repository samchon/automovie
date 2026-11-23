# src/motion/resolveBoneMap.ts#resolveBoneMap

## @evidence contracts/development/implementation.md#principled-implementation

Delegates parent-first FK to resolvePose and creates a name map over its reachable results, preserving its omitted-cycle/detached-bone and later-duplicate-joint semantics.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The map adapter supplies constant-time bone lookup to contact passes without duplicating the hierarchy or clinical quaternion rules.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No detached bone is reattached or fake transform inserted; map membership follows the FK owner exactly, and supplied semantic tables are used without consumer-specific overrides.

## @evidence contracts/development/common.md#meaningful-documentation

States reachable membership, optional topology/mapping premises and the no-scale FK frame used by planting and retargeting.

## @evidence contracts/development/implementation.md#efficient-algorithms

Raw FK keeps ordered joint admission and linear static rig scans with optional exact math reuse. Omitted demand returns B bones; explicit demand computes only its ancestor closure and returns K records. One O(K) direct map build uses no entry-tuple array, and omitted topology adds O(total bones).

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Passes caller topology and an optional operation-owned preparePoseResolution adapter to the same FK owner. Original raw reads/ordered admission remain live; exact admitted-basis/angle factors alone share pure work across source, zeroed and reference poses.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a caller-owned map and fresh resolved bone records. The result array is temporary; the adapter's weak admitted-basis workspaces remain with its operation, and no map, raw transform, handle or global cache is retained here.
