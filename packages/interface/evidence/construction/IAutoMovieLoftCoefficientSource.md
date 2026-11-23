# src/construction/IAutoMovieLoftCoefficientSource.ts#IAutoMovieLoftCoefficientSource.IEnd

## @evidence contracts/development/design.md#principled-representation

A closing pole contributes the zero section and its natural-spline parameter jets without placing a degenerate principal layer in the chain.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One station and one existing Hermite endpoint layout carry virtual cap data.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Finite parameter slopes/curvatures make no claim of finite physical-station derivatives.

## @evidence contracts/development/common.md#meaningful-documentation

Station uses kernel mm and slope/curvature use the selected parameter coordinate.

# src/construction/IAutoMovieLoftCoefficientSource.ts#IAutoMovieLoftCoefficientSource.IEnds

## @evidence contracts/development/design.md#principled-representation

Only a declared bottom/top pole receives a virtual zero section at its original station.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two optional records distinguish open ends from single/both caps.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Absence does not invent a cap or extend an open end.

## @evidence contracts/development/common.md#meaningful-documentation

Members identify which end owns each finite parameter endpoint.

# src/construction/IAutoMovieLoftCoefficientSource.ts#IAutoMovieLoftCoefficientSource.ISource

## @evidence contracts/development/design.md#principled-representation

The layer's existing coefficients remain its values; these arrays supply their first/second derivatives in the explicit map, so equal-value copies retain the same interpolation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One map, two derivative arrays and shared endpoint data extend the existing principal-layer definition without a hidden source-value copy.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A transformed endpoint must explicitly remove/re-express this parameter data; mismatched or absent endpoint maps select the documented station-Hermite boundary, never a fitted source.

## @evidence contracts/development/common.md#meaningful-documentation

Arrays use the existing coefficient layout; source data and the chain are immutable after preparation, as required by existing station caches.

# src/construction/IAutoMovieLoftCoefficientSource.ts#IAutoMovieLoftCoefficientSource.IControls

## @evidence contracts/development/design.md#principled-representation

Parameter Hermite weights and the forward map's optional station change define value and both physical derivative orders.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Existing Hermite endpoint arrays preserve lazy per-control combination in the consumer.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A null change keeps a finite parameter value but supplies no finite physical 2-jet.

## @evidence contracts/development/common.md#meaningful-documentation

Rows are value/first/second parameter orders; change is dq/ds,d2q/ds2.
