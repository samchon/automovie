# src/construction/IAutoMovieAxisDirection.ts#IAutoMovieAxisDirection

## @evidence contracts/development/design.md#principled-representation

Projection records keep a vector and its normal/target norms in one positive homogeneous scale; finite nonzero projection admission belongs to AxisDirection.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The interface owns IProjection for AxisDirection and ViewAxis so both read the same scaled direction.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No fallback direction or acceptance flag is encoded; the numeric record alone cannot certify conditioning.

## @evidence contracts/development/common.md#meaningful-documentation

Defines the common projection scale and the normal-to-target ratio.

# src/construction/IAutoMovieAxisDirection.ts#IAutoMovieAxisDirection.IProjection

## @evidence contracts/development/design.md#principled-representation

Projection and target norms share whichever positive homogeneous scale was used, so their ratio is the relative normal projection.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One vector and two scalars carry all projection ownership.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No acceptance or geometric replacement is encoded in this numeric record.

## @evidence contracts/development/common.md#meaningful-documentation

Members state the adjusted direction scale and its norm interpretation.
