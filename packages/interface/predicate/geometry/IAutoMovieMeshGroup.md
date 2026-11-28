# src/geometry/IAutoMovieMeshGroup.ts#IAutoMovieMeshGroup

## @evidence contracts/development/common.md#meaningful-documentation

One assembly member's contiguous span of triangle index entries.

## @evidence contracts/development/design.md#principled-representation

The assembler advances the next start by the current index count, including the implicit indices of an unindexed member.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Member ID and two offsets locate triangles after rebasing. Positions and material data remain in the mesh and its consumers.

# src/geometry/IAutoMovieMeshGroup.ts#IAutoMovieMeshGroup.id

## @evidence contracts/development/common.md#meaningful-documentation

Original assembly member ID, copied unchanged after duplicate checking.

# src/geometry/IAutoMovieMeshGroup.ts#IAutoMovieMeshGroup.start

## @evidence contracts/development/common.md#meaningful-documentation

Zero-based entry offset in the merged indices array. For zero-count members this marks the next write position.

# src/geometry/IAutoMovieMeshGroup.ts#IAutoMovieMeshGroup.count

## @evidence contracts/development/common.md#meaningful-documentation

Number of index entries in this range, divisible by three. An empty member contributes zero.
