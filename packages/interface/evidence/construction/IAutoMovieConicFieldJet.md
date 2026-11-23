# src/construction/IAutoMovieConicFieldJet.ts#IAutoMovieConicFieldJet

## @evidence contracts/development/design.md#principled-representation

IJet fixes the six entries of a symmetric two-coordinate Hessian; IAlgebra preserves those coordinates across scalar operations and primal branch reads.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The interface owns the arithmetic boundary used by the engine's NUMBER and AD conic implementations.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The tuple enforces entry count but not finite values or geometric regularity; geometry owners admit divisors and source domains.

## @evidence contracts/development/common.md#meaningful-documentation

States derivative order, absence of factorial scaling and each operation's premises.

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
