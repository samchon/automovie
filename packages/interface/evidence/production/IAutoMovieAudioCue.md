# src/production/IAutoMovieAudioCue.ts#IAutoMovieAudioCue

## @evidence contracts/development/design.md#principled-representation

Frame-or-second boundaries describe source trim and film placement before lowering to a common frame grid; this authored DTO carries the required bounds but performs no conversion or validation itself.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One cue owns source range, destination start, gain, fades and bus, while asset bytes and production frame rate stay in their own ledger and frame-format records.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Declared source duration does not prove actual asset duration; callers must validate frame-grid agreement, trim bounds, fade coverage and finite bounded gain before passing a lowered cue to deterministic mixing.

## @evidence contracts/development/common.md#meaningful-documentation

Gives source-versus-film time ownership, frame-grid interpretation, interval and fade constraints, finite linear gain bounds and the four deterministic destination buses.
