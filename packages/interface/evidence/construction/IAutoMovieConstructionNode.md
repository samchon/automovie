# src/construction/IAutoMovieConstructionNode.ts#IAutoMovieConstructionNode

## @evidence contracts/development/design.md#principled-representation

View/source leaves undergo native lofting; profile leaves retain their actual piece fields through the existing atlas and mesh; joins, continuation, splits, ports and trims compose their solids through the tree's containment order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One closed union over declared views, complete native sources, original profiles and five operation records keeps explicit source references separate from declarative views without per-form variants.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Operator children remain contained nodes; a source key binds generating input in the current invocation, never an already realized solid or a global geometry registry. Shared runtime input does not create a second parent in the tree.

## @evidence contracts/development/common.md#meaningful-documentation

States each discriminant, containment and the distinction between a source input reference and solid-tree topology.
