# src/construction/IAutoMovieViewOutline.ts#IAutoMovieViewOutline.IEnds

## @evidence contracts/development/design.md#principled-representation

Names the two possible endpoints of the published pole parameter.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Optional bottom and top numbers represent open, single-pole and two-pole sources.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Missing means open; admission checks each declared endpoint instead of substituting one.

## @evidence contracts/development/common.md#meaningful-documentation

States station units and absent-end meaning.

# src/construction/IAutoMovieViewOutline.ts#IAutoMovieViewOutline.IOutline

## @evidence contracts/development/design.md#principled-representation

Stores the original named knots and the natural spline in their admitted station or pole parameter.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One record retains source identity, span, closure and prepared scalar spline.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No surviving section, fitted points or mesh observations replace the input knots.

## @evidence contracts/development/common.md#meaningful-documentation

Members distinguish station domain and spline parameter and identify copied inputs.

# src/construction/IAutoMovieViewOutline.ts#IAutoMovieViewOutline.IFailure

## @evidence contracts/development/design.md#principled-representation

Retains the existing outline or pole-knot construction contract and its input failure.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A contract and detail suffice without an exception or substitute curve.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A failed source remains failed and named.

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the contract discriminator and original input detail.

# src/construction/IAutoMovieViewOutline.ts#IAutoMovieViewOutline.IReading

## @evidence contracts/development/design.md#principled-representation

Separates finite position from the station change of parameter, whose derivatives can be singular or exceed binary64 at a pole.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One scalar reading carries both jet units and their availability status.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No finite jet is invented for a singular endpoint and no finite point is hidden for an unrepresentable station derivative.

## @evidence contracts/development/common.md#meaningful-documentation

Members state scalar units, parameter/station derivatives, absence status and tangent extension location.
