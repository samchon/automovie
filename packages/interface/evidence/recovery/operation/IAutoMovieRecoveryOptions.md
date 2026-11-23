# src/recovery/operation/IAutoMovieRecoveryOptions.ts#IAutoMovieRecoveryOptions

## @evidence contracts/development/design.md#principled-representation

Caller-owned cancellation and progress are observed only at the synchronous operation's declared checkpoints.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One options record carries observation basis selection, optional station limits and caller progress without owning geometry.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Cancellation is cooperative; these options do not promise interruption while the event loop is blocked.

## @evidence contracts/development/common.md#meaningful-documentation

States selector defaults, omitted station-limit meaning, callback ownership and progress-exception behavior.
