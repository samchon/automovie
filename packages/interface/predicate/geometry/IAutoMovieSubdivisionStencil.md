# src/geometry/IAutoMovieSubdivisionStencil.ts#IAutoMovieSubdivisionStencil

## @evidence contracts/development/common.md#meaningful-documentation

The type gives the exact compressed-row traversal and when connectivity permits reuse.

## @evidence contracts/development/design.md#principled-representation

The stencil owner derives a row from quad valence and neighboring indices. The inverse solver applies each row as weighted XYZ control sums and reuses it through every iteration.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Rows store only topology-derived indices and weights. Position and scratch storage belong to the solver's caller.

# src/geometry/IAutoMovieSubdivisionStencil.ts#IAutoMovieSubdivisionStencil.count

## @evidence contracts/development/common.md#meaningful-documentation

The value gives the number of control vertices and limit rows.

# src/geometry/IAutoMovieSubdivisionStencil.ts#IAutoMovieSubdivisionStencil.offsets

## @evidence contracts/development/common.md#meaningful-documentation

The signed integer typed array supplies row starts and a terminal element at offsets[count].

# src/geometry/IAutoMovieSubdivisionStencil.ts#IAutoMovieSubdivisionStencil.indices

## @evidence contracts/development/common.md#meaningful-documentation

Each signed integer term addresses its associated control vertex.

# src/geometry/IAutoMovieSubdivisionStencil.ts#IAutoMovieSubdivisionStencil.weights

## @evidence contracts/development/common.md#meaningful-documentation

Each binary64 coefficient multiplies the control vertex named by the aligned index.
