# src/construction/IAutoMovieConicFieldJet.ts#IAutoMovieConicFieldJet.IJet

## @evidence contracts/development/design.md#principled-representation

Stores the full symmetric Hessian of one scalar in two source coordinates, without factorial scaling.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Six fixed entries describe exactly the total-order-two source field.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No phase/native-clock derivatives or unavailable physical-pole jets are implied.

## @evidence contracts/development/common.md#meaningful-documentation

Gives entry order, derivative convention and caller-owned coordinate units.

# src/construction/IAutoMovieConicFieldJet.ts#IAutoMovieConicFieldJet.IAlgebra

## @evidence contracts/development/design.md#principled-representation

The same arithmetic interface supports ordinary scalars and source partials, with primal branch decisions read through value.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the existing rational, root and logarithmic operations needed by the conic kernels are exposed.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The interface supplies no geometry fallback, derivative estimate or implicit validation.

## @evidence contracts/development/common.md#meaningful-documentation

Each member identifies its scalar meaning; admission remains at the geometry owner.
