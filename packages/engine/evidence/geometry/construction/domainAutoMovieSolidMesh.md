# src/geometry/construction/domainAutoMovieSolidMesh.ts#domainAutoMovieSolidMesh

## @evidence contracts/development/implementation.md#principled-implementation

Orders original chart identities on the rectangle sides or two periodic station ends and represents closing periodic edges by explicit relative cover turns.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One domain assembly operation uses existing constraint types and a local grid-index callback, with no source evaluator or mesh write.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Never inserts a new index into an existing trim segment or welds distinct authoritative IDs. Coincident identities, invalid source coordinates and unrepresentable cover arithmetic fail explicitly.

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes temporary cover coordinates, original IDs and local catalogue growth through the callback.

## @evidence contracts/development/implementation.md#efficient-algorithms

Scans V existing points per domain side, tests at most G boundary samples against S trim edges and sorts each side; work is O(V+GS+G log G) for a fixed number of sides, plus callback work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses supplied trim endpoints and existing grid IDs; source points are not reevaluated or reconstructed from triangles.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Side arrays and returned segments are linear in boundary points, with no global cache; the local catalogue and new callback-created points remain caller-owned.
