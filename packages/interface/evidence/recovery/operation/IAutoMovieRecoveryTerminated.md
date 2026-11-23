# src/recovery/operation/IAutoMovieRecoveryTerminated.ts#IAutoMovieRecoveryTerminated

## @evidence contracts/development/design.md#principled-representation

Refused, failed and cancelled terminal states explain why the operation returned no usable value.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The terminal status shares operator identity and diagnostics with value-carrying outcomes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A terminated outcome cannot supply an invented value or turn cancellation into successful completion.

## @evidence contracts/development/common.md#meaningful-documentation

States the absence of usable output and the meaning of each terminating state.
