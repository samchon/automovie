# src/construction/IAutoMovieConicArc.ts#IAutoMovieConicArc

## @evidence contracts/development/design.md#principled-representation

IRay carries original-quarter point/tangent geometry, radial angular derivatives and the selected quadratic or cubic clock; the arc reader owns clock admission.

## @evidence contracts/development/design.md#minimal-and-owned-surface

ConicArc, its differentiated reader and ViewConic share this source-location contract.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Endpoint identity is explicit even when clock is null; nullable clocks do not themselves enforce every quadratic/cubic combination.

## @evidence contracts/development/common.md#meaningful-documentation

Describes source chart, increasing-polar orientation and endpoint/clock meanings.

# src/construction/IAutoMovieConicArc.ts#IAutoMovieConicArc.IRay

## @evidence contracts/development/design.md#principled-representation

One selected native/projective clock and its geometric reading identify the actual source point.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Quadratic and G2 adapters share one location record.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A descriptor does not claim source derivatives or retain a source callback.

## @evidence contracts/development/common.md#meaningful-documentation

Point and tangent use the original quarter chart; radial derivatives increase polar angle; reverse identifies the chosen end chart.
