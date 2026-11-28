# src/geometry/IAutoMovieMeshQueryHierarchy.ts#IAutoMovieMeshQueryHierarchy

## @evidence contracts/development/common.md#meaningful-documentation

The union documents the box meaning, the leaf discriminator and what rebuilding and refitting preserve.

## @evidence contracts/development/design.md#principled-representation

The builder median-splits the widest XYZ extent and stops at twelve entries, preserving exact extrema. The refitter replaces entries and re-aggregates boxes without moving the original partitions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The hierarchy owns spatial ordering and bounds. Query consumers separately supply their actual triangle, capsule or point entries.

# src/geometry/IAutoMovieMeshQueryHierarchy.ts#IAutoMovieMeshQueryHierarchy.IEntry

## @evidence contracts/development/common.md#meaningful-documentation

The entry describes enclosing metre-frame bounds and the partition centre.

## @evidence contracts/development/design.md#principled-representation

Builders read bounds for enclosure and centre only for sort order. Refit reads the replacement bounds and never re-sorts by the replacement centre.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The index requires only spatial metadata of its generic entry. The entry subtype owns its original geometry.

# src/geometry/IAutoMovieMeshQueryHierarchy.ts#IAutoMovieMeshQueryHierarchy.IEntry.low

## @evidence contracts/development/common.md#meaningful-documentation

Defines componentwise lower bounds of the contained geometry in the shared metre frame.

# src/geometry/IAutoMovieMeshQueryHierarchy.ts#IAutoMovieMeshQueryHierarchy.IEntry.high

## @evidence contracts/development/common.md#meaningful-documentation

Defines componentwise upper bounds of the same object and frame.

# src/geometry/IAutoMovieMeshQueryHierarchy.ts#IAutoMovieMeshQueryHierarchy.IEntry.centre

## @evidence contracts/development/common.md#meaningful-documentation

The finite sort point determines initial median partitioning while the enclosing bounds still come from the geometry.

# src/geometry/IAutoMovieMeshQueryHierarchy.ts#IAutoMovieMeshQueryHierarchy.ILeaf

## @evidence contracts/development/common.md#meaningful-documentation

The declaration states the admission limit and distinguishes the empty leaf's sentinel bounds.

## @evidence contracts/development/design.md#principled-representation

The recursive builder stops at twelve entries. The empty case yields no entries with positive infinity low and negative infinity high, and refit reconstructs this same union.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A leaf stores its local entries by reference. Its extrema permit pruning without opening the entries.

# src/geometry/IAutoMovieMeshQueryHierarchy.ts#IAutoMovieMeshQueryHierarchy.ILeaf.low

## @evidence contracts/development/common.md#meaningful-documentation

The XYZ lower union is positive infinity in each axis for an empty leaf.

# src/geometry/IAutoMovieMeshQueryHierarchy.ts#IAutoMovieMeshQueryHierarchy.ILeaf.high

## @evidence contracts/development/common.md#meaningful-documentation

The XYZ upper union is negative infinity in each axis for an empty leaf.

# src/geometry/IAutoMovieMeshQueryHierarchy.ts#IAutoMovieMeshQueryHierarchy.ILeaf.triangles

## @evidence contracts/development/common.md#meaningful-documentation

The list retains references in leaf order and forms the proximity walk's actual leaf population.

# src/geometry/IAutoMovieMeshQueryHierarchy.ts#IAutoMovieMeshQueryHierarchy.IBranch

## @evidence contracts/development/common.md#meaningful-documentation

The declaration explains the original median halves and refit without repartitioning.

## @evidence contracts/development/design.md#principled-representation

Each branch combines both child boxes. Refit recreates lower and upper subtrees independently without exchanging membership.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A branch holds exactly two shared hierarchy variants. Actual resident entries stay at the leaves.

# src/geometry/IAutoMovieMeshQueryHierarchy.ts#IAutoMovieMeshQueryHierarchy.IBranch.low

## @evidence contracts/development/common.md#meaningful-documentation

The box lower extrema span both current child subtrees.

# src/geometry/IAutoMovieMeshQueryHierarchy.ts#IAutoMovieMeshQueryHierarchy.IBranch.high

## @evidence contracts/development/common.md#meaningful-documentation

The box upper extrema span both current child subtrees.

# src/geometry/IAutoMovieMeshQueryHierarchy.ts#IAutoMovieMeshQueryHierarchy.IBranch.left

## @evidence contracts/development/common.md#meaningful-documentation

The child represents current entries of the originally lower median half.

# src/geometry/IAutoMovieMeshQueryHierarchy.ts#IAutoMovieMeshQueryHierarchy.IBranch.right

## @evidence contracts/development/common.md#meaningful-documentation

The child represents current entries of the originally upper median half.
