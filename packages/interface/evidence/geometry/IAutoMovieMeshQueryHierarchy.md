# src/geometry/IAutoMovieMeshQueryHierarchy.ts#IAutoMovieMeshQueryHierarchy

## @evidence contracts/development/design.md#principled-representation

A bounding-volume hierarchy whose node extrema are taken from the entry boxes, so the enclosure that makes pruning sound is a property of the stored numbers rather than of how the tree was split.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One exported node type replaces the `ReturnType<typeof buildAutoMovieMeshQueryHierarchy<T>>` spelling every walker used to reconstruct, and the leaf keeps the field name `triangles` its existing walkers test for.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The tree stores entries as given and never pads a node box, so a walker can prune only what the entry boxes themselves exclude.

## @evidence contracts/development/common.md#meaningful-documentation

States initial build versus fixed-partition refit, the walkers/frame, enclosure lower bounds, leaf ownership and variant discrimination.

# src/geometry/IAutoMovieMeshQueryHierarchy.ts#IAutoMovieMeshQueryHierarchy.IEntry

## @evidence contracts/development/design.md#principled-representation

Node boxes are unions of `low` and `high`, so those must enclose the entry's geometry; `centre` only orders entries along the split axis and never widens or replaces the box.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The structural minimum the builder needs, so triangle records, lash capsules and envelope centres all qualify without a shared base class.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A caller may not shrink the box to speed pruning; a box smaller than its geometry would let a walker skip a real nearest feature.

## @evidence contracts/development/common.md#meaningful-documentation

States what each field must enclose or represent and that the centre never stands in for geometry.

# src/geometry/IAutoMovieMeshQueryHierarchy.ts#IAutoMovieMeshQueryHierarchy.ILeaf

## @evidence contracts/development/design.md#principled-representation `low` and `high` are the componentwise extrema of the held entries' boxes, so they enclose every entry; an empty leaf keeps the empty-union sentinels positive and negative infinity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A box plus the entries themselves, so a walker tests the leaf box once and then each entry's own box without another lookup.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Entries are kept by reference with no copy or rounding, so a walker reads the same geometry the caller compiled.

## @evidence contracts/development/common.md#meaningful-documentation

States the leaf size limit, the infinite sentinels of an empty leaf, and that entries are held by reference.

# src/geometry/IAutoMovieMeshQueryHierarchy.ts#IAutoMovieMeshQueryHierarchy.IBranch

## @evidence contracts/development/design.md#principled-representation

The node box is the union of both children's entries, so a walker that skips the branch skips nothing its box could not contain.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two children and the enclosing box, with no stored split axis, because no walker needs it once the boxes exist.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Both children are always nonempty, so no walker needs a guard for a hollow branch.

## @evidence contracts/development/common.md#meaningful-documentation

States original split preservation under refit and that current node bounds enclose both current children.
