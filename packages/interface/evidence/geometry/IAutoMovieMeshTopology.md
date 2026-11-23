# src/geometry/IAutoMovieMeshTopology.ts#IAutoMovieMeshTopology

## @evidence contracts/development/design.md#principled-representation

Edge counts come from an undirected edge map over welded or physical corner identities, so a seam split for UVs still counts as one edge, and volume is the divergence-theorem sum of signed tetrahedra against the origin, exact for any closed consistently wound polyhedron.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Plain counts plus the degenerate ordinals and the volume, the facts a builder, the human part census and the portrait mesh placement read, while pass or fail stays with `validateMeshTopology`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Degenerate triangles are listed and left out of the edge map rather than repaired, and an empty or fully degenerate mesh reports not watertight instead of passing vacuously.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer, how corners are identified with and without physical vertices, which attribute buffers the non-finite count covers, which triangles each count excludes, the watertight condition including the empty case, and the volume's unit and sign.
