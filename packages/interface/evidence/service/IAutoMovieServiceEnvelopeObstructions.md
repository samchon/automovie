# src/service/IAutoMovieServiceEnvelopeObstructions.ts#IAutoMovieServiceEnvelopeObstructions.IProps

## @evidence contracts/development/design.md#principled-representation

bounds is an admitted finite ordered world-metre AABB; serviceEnvelopeObstructions compares it to node-local maintenance boxes translated by node position.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The obstruction query reuses IAutoMoviePropBox and the same serviceMaintenanceBounds conversion used by network interference checks.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No input validation or mutation occurs; exterior face contact is excluded by strict endpoint comparisons, but internal degenerate boxes may still pass.

## @evidence contracts/development/common.md#meaningful-documentation

World box queried against translated service maintenance envelopes. bounds is an admitted finite ordered world-metre AABB; serviceEnvelopeObstructions compares it to node-local maintenance boxes translated by node position.
