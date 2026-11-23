# src/scene/resolve/IAutoMovieResolveInput.ts#IAutoMovieResolveInput

## @evidence contracts/development/design.md#principled-representation

Supply parent-local nodes, optional clip sequence, ordered channel limits/drivers, profile applications and explicit cross-frame spring state for one finite-time frame resolution.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Inputs expose the sample, clamp, compose and world-driver responsibilities without embedding host objects or hiding stateful springs behind a pure-looking call.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Absent clips select rest pose and absent spring state defers springs; unsupported graph/channels are refused by their owning helpers rather than silently synthesized.

## @evidence contracts/development/common.md#meaningful-documentation

Members distinguish borrowed node/clip arrays, profile-before-direct policy order, seconds and in-place spring advancement.
