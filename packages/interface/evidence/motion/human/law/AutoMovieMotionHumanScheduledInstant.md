# src/motion/human/law/AutoMovieMotionHumanScheduledInstant.ts#AutoMovieMotionHumanScheduledInstant

## @evidence contracts/development/common.md#meaningful-documentation

A scheduled instant expressed as film seconds or a reference to a named action event with an optional occurrence and seconds offset. Layer and prop-track scheduling resolve the same representation.

## @evidence contracts/development/design.md#principled-representation

of: Action or cue id supplying the reference event. event: Reference event name; omitted uses the referenced action's default event. index: Zero-based occurrence index of a repeated event; defaults to 0.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Layer schedules and prop tracks share the instant representation resolved by HumanPerformance.instant, HumanPerformanceLayers and performance-state early scheduling.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Numeric values are film seconds; the reference alternative carries the anchor/event, zero-based occurrence and signed seconds offset. Runtime schedule resolution owns lookup and dependency refusal.
