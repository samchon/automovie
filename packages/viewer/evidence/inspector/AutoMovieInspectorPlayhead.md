# src/inspector/AutoMovieInspectorPlayhead.ts#AutoMovieInspectorPlayhead

## @evidence contracts/development/design.md#principled-representation

Seconds and duration are subject seconds, the rate is a positive multiplier of wall time and playing is a boolean; the snapshot is one immutable record so the external-store contract's identity comparison is exact.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the inspector, one per mounted component; the scene mount calls `setDuration`, `seek` and `advance`, the time panel `play`, `pause` and `setRate` and subscribes to the playing flag, the readout `seek`, `subscribe` and `getSnapshot`, and the inspector's keys, through `handleAutoMovieInspectorKey`, `play`, `pause`, `seek` and `getSnapshot`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `subscribe` and `getSnapshot` are bound properties, so React keeps one subscription across renders instead of resubscribing to a new function each time.

## @evidence contracts/development/common.md#meaningful-documentation

States who moves and who reads the playhead and what each reader re-renders on, why it lives outside React, the snapshot's identity rule, the range and why the rate is not a request member.

# src/inspector/AutoMovieInspectorPlayhead.ts#AutoMovieInspectorPlayhead.prototype.subscribe

## @evidence contracts/development/common.md#meaningful-documentation

States when the listener runs and how it is removed.

## @evidence contracts/development/implementation.md#principled-implementation

The external-store contract React's `useSyncExternalStore` reads: subscribe returns its own unsubscribe.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One set of listeners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The same listener given twice is held once, as a set holds it.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time to add and to remove.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A registration computes nothing.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds the listener until its unsubscribe runs; the set grows by one per live subscription, which React keeps at two per mounted inspector, the time panel's and the readout's.

# src/inspector/AutoMovieInspectorPlayhead.ts#AutoMovieInspectorPlayhead.prototype.getSnapshot

## @evidence contracts/development/common.md#meaningful-documentation

States the identity rule.

## @evidence contracts/development/implementation.md#principled-implementation `useSyncExternalStore` requires a cached snapshot, or it renders forever.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Returns the held record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Never builds a record on read.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Returns what is held.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates nothing.

# src/inspector/AutoMovieInspectorPlayhead.ts#AutoMovieInspectorPlayhead.prototype.setDuration

## @evidence contracts/development/common.md#meaningful-documentation

States when it is called, the clamp and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Seconds beyond the subject's end show nothing of it, so the second is clamped to the new range.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Check, then one change.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A bad duration is refused instead of clamping every second to zero.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant plus one call per listener.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A state change.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Replaces one record.

# src/inspector/AutoMovieInspectorPlayhead.ts#AutoMovieInspectorPlayhead.prototype.play

## @evidence contracts/development/common.md#meaningful-documentation

States the restart at the end and that it is a jump.

## @evidence contracts/development/implementation.md#principled-implementation

A playhead at the end has nothing left to play, so play means the whole subject again.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One change.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Playing an unready subject (duration zero) is a no-op rather than a loop at zero.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant plus one call per listener.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A state change.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Replaces one record.

# src/inspector/AutoMovieInspectorPlayhead.ts#AutoMovieInspectorPlayhead.prototype.pause

## @evidence contracts/development/common.md#meaningful-documentation

States that the second is kept.

## @evidence contracts/development/implementation.md#principled-implementation

The paused second is the picture the request then names.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One change.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Pausing a paused playhead changes nothing and notifies no one.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant plus one call per listener.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A state change.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Replaces one record.

# src/inspector/AutoMovieInspectorPlayhead.ts#AutoMovieInspectorPlayhead.prototype.seek

## @evidence contracts/development/common.md#meaningful-documentation

States the clamp, that playing continues, the jump and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

A slider or an address can ask past either end, and the nearest second the subject has is the one drawn. A seek is the one discontinuity continuous playback can contain, so it advances the jump count.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Check, clamp, change.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

NaN is refused instead of clamped to an end, and a seek to the shown second is not a jump.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant plus one call per listener.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A state change.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Replaces one record.

# src/inspector/AutoMovieInspectorPlayhead.ts#AutoMovieInspectorPlayhead.prototype.setRate

## @evidence contracts/development/common.md#meaningful-documentation

States the unit and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The rate multiplies the wall time `advance` is given.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Check, change.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Zero and negative rates are refused; pausing is `pause`.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant plus one call per listener.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A state change.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Replaces one record.

# src/inspector/AutoMovieInspectorPlayhead.ts#AutoMovieInspectorPlayhead.prototype.advance

## @evidence contracts/development/common.md#meaningful-documentation

States the unit, the stop at the end and the paused case.

## @evidence contracts/development/implementation.md#principled-implementation

Subject time is wall time scaled by the rate; reaching the end pauses there so the last picture stays.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One change from one sum.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Negative or non-finite wall time, such as a clock step backwards, moves nothing.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant plus one call per listener, once per animation frame while playing.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A state change.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Replaces one record.

# src/inspector/AutoMovieInspectorPlayhead.ts#AutoMovieInspectorPlayhead.ISnapshot

## @evidence contracts/development/design.md#principled-representation

Subject seconds and duration, a wall-time multiplier, a playing flag and a count of discontinuous moves, with `0 <= seconds <= durationSeconds` kept by the playhead.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The four members the readout shows and the loop reads, and the jump count by which the loop tells continuous playback from a seek.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A duration of zero means no instance is ready yet, not a subject that lasts no time. Continuity is counted where moves happen, not guessed from how far the seconds moved.

## @evidence contracts/development/common.md#meaningful-documentation

States each member's unit, the zero duration and what counts as a jump.
