# src/geometry/admitSubdivisionCage.ts#admitSubdivisionCage

## @evidence contracts/development/implementation.md#principled-implementation

Every premise the refinement rules rely on, finite coordinates, valid polygons, a manifold with one fan per vertex, existing crease edges and vertex-owned UVs, is checked once here so later levels, which preserve them, need no checks.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admission and the level-zero layout in one place; manifold checks are delegated to the topology builder that every level uses.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is clamped, dropped, welded or rewound; each defect is refused by index.

## @evidence contracts/development/common.md#meaningful-documentation

Lists every refusal, the initial parameters, and that inputs are only read.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in positions, corners, creases and UVs, with one hash map of crease edges and one owner table for UVs.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call admits a new cage.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Copies the cage into level-zero arrays linear in its size; the crease map and UV owner table are released on return.
