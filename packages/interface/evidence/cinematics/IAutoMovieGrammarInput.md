# src/cinematics/IAutoMovieGrammarInput.ts#IAutoMovieGrammarInput

## @evidence contracts/development/design.md#principled-representation

Shot order is the edit's playback order and is read as given, while subject lists and action-axis endpoints inside each shot are normalized by id, so the result depends on the edit and not on how the caller enumerated subjects.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The shots plus the only two tunable numbers the analyzer has, both optional with fixed defaults, so a caller that accepts the defaults passes the shots alone.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The defaults are named constants in the analyzer applied to every edit alike, and an invalid threshold throws rather than being clamped to the default.

## @evidence contracts/development/common.md#meaningful-documentation

States the consumers, the failure effect, the order meaning of `shots`, and each threshold's unit, default and valid range.
