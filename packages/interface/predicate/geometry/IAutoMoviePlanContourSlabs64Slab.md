# src/geometry/IAutoMoviePlanContourSlabs64Slab.ts#IAutoMoviePlanContourSlabs64Slab

## @evidence contracts/development/common.md#meaningful-documentation

The slab identifies adjacent retained cuts by increasing upper-cut index and carries its newly allocated group list.

## @evidence contracts/development/design.md#principled-representation

Planning iterates upper indices from one. Both explicit incidence and geometric correspondence populate one list at the same slab ordinal. A single retained cut yields no list entry.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The slab stores one positional index and planned groups. Physical cut coordinates and rings remain in the separately aligned section data.

# src/geometry/IAutoMoviePlanContourSlabs64Slab.ts#IAutoMoviePlanContourSlabs64Slab.k

## @evidence contracts/development/common.md#meaningful-documentation

The index addresses the upper retained cut and derives the lower cut at k-1.

# src/geometry/IAutoMoviePlanContourSlabs64Slab.ts#IAutoMoviePlanContourSlabs64Slab.groups

## @evidence contracts/development/common.md#meaningful-documentation

The list retains the planned groups and local omissions and can be empty when neither cut has work.
