# src/model/IAutoMovieMesh.ts#IAutoMovieMesh

## @evidence contracts/development/design.md#principled-representation

Parallel flat buffers share one render-vertex index; validateMesh checks tuple cardinality, finite values, indices, skin weights and morph targets, while physical correspondence separately identifies true source aliases for topology without merging independent contact points.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Positions and triangle addressing are the geometry core, with nullable shading and skin buffers and optional correspondence, colour, relief and morph target attributes; each optional attribute states its own neutral absence rather than requiring placeholder arrays.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Explicit buffers come from adopted bytes or an authored generator, without a source-identity exemption from existing admission. Physical correspondence supplies topology; incidence and winding checks alone do not certify nonzero triangle area or absence of geometric intersections.

## @evidence contracts/development/common.md#meaningful-documentation

Defines flat tuple layouts, metre positions, attribute alignment, indexed and non-indexed ordering, null shading and skin semantics, physical-source ownership and optional colour and relief defaults and export limits.
