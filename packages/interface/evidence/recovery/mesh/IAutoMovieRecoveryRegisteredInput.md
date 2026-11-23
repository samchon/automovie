# src/recovery/mesh/IAutoMovieRecoveryRegisteredInput.ts#IAutoMovieRecoveryRegisteredInput

## @evidence contracts/development/design.md#principled-representation

Explicit registration binds the supplied millimetre positions and oriented triangle indices to the caller's evaluated pose.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The record groups evaluated geometry, its registration and the policy forwarded to observation; loading and transformation remain caller responsibilities.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A declared matrix is recorded as already applied, rather than becoming an instruction to transform the vertices again.

## @evidence contracts/development/common.md#meaningful-documentation

States the physical frame, borrowed arrays, triangle addressing and the caller's responsibility for evaluated geometry.
