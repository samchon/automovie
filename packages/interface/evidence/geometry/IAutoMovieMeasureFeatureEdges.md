# src/geometry/IAutoMovieMeasureFeatureEdges.ts#IAutoMovieMeasureFeatureEdges

## @evidence contracts/development/design.md#principled-representation

Groups the input and result of the feature edge measurement.

## @evidence contracts/development/design.md#minimal-and-owned-surface

`interface` owns it; `measureAutoMovieFeatureEdges` produces the result, `autoMovieFeatureEdgeDistance` and render's `applyMaterialWear` read it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No member names a model or a consumer.

## @evidence contracts/development/common.md#meaningful-documentation

States what the measurement finds and why it exists.

# src/geometry/IAutoMovieMeasureFeatureEdges.ts#IAutoMovieMeasureFeatureEdges.IProps

## @evidence contracts/development/design.md#principled-representation

Flat object-space positions in metres, triangle indices and a reach in metres. `ArrayLike` lets a renderer pass its attribute arrays without copying; the positive reach is checked at runtime.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Exactly what the measurement reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No normals are taken: face normals are derived from the welded positions, so split normals cannot hide an edge.

## @evidence contracts/development/common.md#meaningful-documentation

States units, the welding rule, the zero-area rule and the reach range.

# src/geometry/IAutoMovieMeasureFeatureEdges.ts#IAutoMovieMeasureFeatureEdges.IResult

## @evidence contracts/development/design.md#principled-representation

Feature segments with their sign, per-triangle index lists in input order and the reach they were measured with.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The renderer packs edges and lists into its texture; the distance reference reads all three members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The reach travels with the lists, so a distance cannot be capped at a different value than the lists were built for.

## @evidence contracts/development/common.md#meaningful-documentation

States the feature rule, the ordering, the 16-entry limit and the tie-break.

# src/geometry/IAutoMovieMeasureFeatureEdges.ts#IAutoMovieMeasureFeatureEdges.IEdge

## @evidence contracts/development/design.md#principled-representation

Two object-space endpoints in metres and a convexity flag.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The shader and the CPU reference read all three.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The sign is a boolean of the two cases the measurement distinguishes.

## @evidence contracts/development/common.md#meaningful-documentation

States the units and how convexity is decided.
