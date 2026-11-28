# src/geometry/AutoMovieBernsteinPolynomial64.ts#AutoMovieBernsteinPolynomial64

## @evidence contracts/development/common.md#meaningful-documentation

Ordered mutable XYZ control triples for one vector Bernstein polynomial, from first coefficient to last.

## @evidence contracts/development/design.md#principled-representation

Bernstein coefficient count determines degree. Elevation, subdivision and evaluation derive from this order without storing a separate degree or sample positions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The record holds only controls. The calling field specifies units, frame and how its local parameter is reached.
