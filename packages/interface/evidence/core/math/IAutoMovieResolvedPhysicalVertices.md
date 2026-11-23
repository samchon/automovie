# src/core/math/IAutoMovieResolvedPhysicalVertices.ts#IAutoMovieResolvedPhysicalVertices

## @evidence contracts/development/design.md#principled-representation

A dense ordinal per render vertex plus one key per ordinal is the interned form of an equivalence relation, so equal identity means equal key and consumers compare integers instead of strings or positions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two parallel arrays with no per-vertex records, because consumers index identities by render vertex and only diagnostics and merge matching read the keys; the same shape is what `weldMeshVertices` returns when a mesh declares no correspondence.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A declared source point and a position-welded vertex never share a key, because their keys carry different prefixes, so an explicit declaration cannot be silently merged with a nearby undeclared vertex.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer, what a shared identity means and who relies on it, the first-occurrence numbering, ownership, and per member the index space and each key form.
