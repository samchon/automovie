# src/geometry/IAutoMovieSubdivisionRingEigenbasis.ts#IAutoMovieSubdivisionRingEigenbasis.IResult

## @evidence contracts/development/design.md#principled-representation

The result contains spatial xyz vectors in the ring's local metre frame, not eigenvector coefficients; tangents have arbitrary mask scale and are not unit normals.

## @evidence contracts/development/design.md#minimal-and-owned-surface

subdivisionRingEigenbasis supplies exceptional dart and crease-sector directions to limitSubdivisionRing.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The caller supplies an admitted ring with stable sharpness; fixed 512-step iteration has no independent convergence certificate and limitSubdivisionRing validates the resulting normal.

## @evidence contracts/development/common.md#meaningful-documentation

A ring's evaluated limit point and two dominant tangent directions. The result contains spatial xyz vectors in the ring's local metre frame, not eigenvector coefficients; tangents have arbitrary mask scale and are not unit normals.
