# src/geometry/IAutoMovieMeshPiece.ts#IAutoMovieMeshPiece

## @evidence contracts/development/design.md#principled-representation

Integer counts of welded vertices, undirected edges, triangles and boundary loops, the Euler characteristic, three Booleans and a genus. `orientable` and `genus` are null exactly where their premises fail, which the type states but `measureAutoMovieMeshPieces` enforces.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the engine's piece census and read by the form expectation check for piece counts and genera; the counts and flags are what a modeller reads to see why a genus is null.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Orientability and stored winding are separate fields because a mis-wound closed shell is still orientable; no optional field or cast is used.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer, the weld, what joins a piece, each count, the manifold, orientable and wound definitions, and the genus formula with its null case.
