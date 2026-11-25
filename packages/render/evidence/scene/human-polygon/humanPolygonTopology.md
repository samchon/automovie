# src/scene/human-polygon/humanPolygonTopology.ts#humanPolygonTopology.IContext

## @evidence contracts/development/design.md#principled-representation

Flat Cartesian positions and triangle indices preserve the original loft emitter representation without unit conversion.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One structural context serves position queries and index emission.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The renderer supplies actual emitted buffers, without fixture or anatomical branches.

## @evidence contracts/development/common.md#meaningful-documentation

States caller ownership and unchanged position units.

# src/scene/human-polygon/humanPolygonTopology.ts#humanPolygonTopology.position

## @evidence contracts/development/implementation.md#principled-implementation

Reads the original three consecutive components at index times three.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Keeps the original position accessor used by crown diagnostics.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Returns source components without reconstruction or correction.

## @evidence contracts/development/common.md#meaningful-documentation

Gives indexed access and unchanged units; the caller supplies a valid index.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work and one three-number tuple.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the existing numerical buffer.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one caller-owned tuple and retains no source.

# src/scene/human-polygon/humanPolygonTopology.ts#humanPolygonTopology.zipper

## @evidence contracts/development/implementation.md#principled-implementation

Reduces phases modulo two pi, rotates each ring to its minimum phase, then advances the next lower phase with one-period sentinels; supplied ring ordering must be monotone cyclically and arrays nonempty with matching phase counts.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One connectivity walk preserves the exact existing triangle order and tie rule.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

It changes no source points and performs no resampling or fixture-specific joining.

## @evidence contracts/development/common.md#meaningful-documentation

States cyclic monotone ordering, nonempty/matching input premises and original winding ownership.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(L+U) time and temporary records for L and U supplied ring vertices.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Appends to the existing caller's triangle buffer.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Phase records are call-local; resulting indices remain caller-owned.

# src/scene/human-polygon/humanPolygonTopology.ts#humanPolygonTopology.cap

## @evidence contracts/development/implementation.md#principled-implementation

Emits the original apex/current/next winding, reversed for a top pole, without adding coordinates.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One fan emitter handles either pole orientation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No replacement terminal ring or hidden cap geometry is introduced.

## @evidence contracts/development/common.md#meaningful-documentation

States existing-ring and apex inputs and top orientation.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(N) index writes for N ring vertices.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Writes the caller's existing index buffer and references its existing pole.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing and allocates no geometry or native handle.
