# src/service/serviceSystemReach.ts#serviceSystemReach

## @evidence contracts/development/implementation.md#principled-implementation

Directed adjacency follows system flow from its root, or combines both directions for a ring; visited ids prevent cycles and optional zero-opening nodes stop expansion after being reached.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Validation and schematic reporting share reach semantics, with port ownership delegated and operating isolation controlled by one explicit input.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Missing roots produce empty reach and unknown systems throw; the default ignores operating closure as the documented design question rather than a network repair.

## @evidence contracts/development/common.md#meaningful-documentation

Defines all flow directions, declaration-order output, valve blocking, root/system failures and structurally admitted graph premises.

## @evidence contracts/development/implementation.md#efficient-algorithms

Adjacency construction scans ports and segments; each reached edge is visited once, but Array.shift can make queue removal quadratic in reached nodes in engines that move remaining entries.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Forward/backward adjacency and the owner map serve the entire current reach walk, with no retained index across network mutations.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Graph maps, queue and visited ids are call-local and linear in input population; output retains only declaration-ordered node ids.
