# src/core/IAutoMovieParentDriver.ts#IAutoMovieParentDriver

## @evidence contracts/development/design.md#principled-representation `resolveWorldDrivers` applies the driver with `Matrix4.decompose` on both world matrices and `Matrix4.compose` of the selected components, then recomposes the owner's descendants from their local transforms; the premise is a TRS-representable world frame, and the shear and sign loss of decomposition are stated as limits.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three independent booleans select the copied components, so following only a hand's position or only its rotation needs no second driver type, and the offset and blend that other rigs carry are left out because no caller needs them.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A flag that is not a boolean throws rather than being coerced, and a missing owner or parent throws through `readWorld` instead of leaving the owner where it was.

## @evidence contracts/development/common.md#meaningful-documentation

States when the driver runs, the snap semantics with no influence or offset, that limits do not apply, the subtree recomposition, the decomposition limits, and each failure that throws.
