# src/harness/IAutoMovieTimingAnchor.ts#IAutoMovieTimingAnchor

## @evidence contracts/development/design.md#principled-representation

Blocking validates the closed beat interval and nondecreasing list order. Performance coverage checks an authored non-frame actor action's unrepeated span with 1e-9-second endpoint slack, resolving auto to shot end; it does not inspect synthesized motion or establish that the cue's described event occurred.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two fields separate the machine-checked instant from its authored meaning; duration and actor identity belong to the enclosing blocking plan rather than being copied into every anchor.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The cue does not trigger phrase-specific synthesis; a temporally uncovered anchor is refused instead of silently moved, and equal times follow the same nondecreasing-order rule.

## @evidence contracts/development/common.md#meaningful-documentation

States beat-local seconds, finite bounds, simultaneous-anchor semantics, action coverage and the limit that cue meaning is not checked against the action.
