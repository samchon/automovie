# src/geometry/IAutoMovieSubdivisionCrease.ts#IAutoMovieSubdivisionCrease

## @evidence contracts/development/common.md#meaningful-documentation

The record explains sharpness decay, fractional interpolation and permanent boundary or maximum sharpness.

## @evidence contracts/development/design.md#principled-representation

The cage owner keys creases by undirected endpoints. Refinement decays interior sharpness by one and retains permanent sharpness 10. Rule transitions blend fractional changes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two original ordinals and one sharpness value suffice. The topology owns edge uses and the refinement owns decayed child values.

# src/geometry/IAutoMovieSubdivisionCrease.ts#IAutoMovieSubdivisionCrease.from

## @evidence contracts/development/common.md#meaningful-documentation

One authored endpoint identifies a cage vertex on the undirected edge.

# src/geometry/IAutoMovieSubdivisionCrease.ts#IAutoMovieSubdivisionCrease.to

## @evidence contracts/development/common.md#meaningful-documentation

The other authored endpoint identifies the same edge regardless of ordering.

# src/geometry/IAutoMovieSubdivisionCrease.ts#IAutoMovieSubdivisionCrease.sharpness

## @evidence contracts/development/common.md#meaningful-documentation

The finite scale runs from smooth zero through fractional semi-sharp values to permanently sharp 10.
