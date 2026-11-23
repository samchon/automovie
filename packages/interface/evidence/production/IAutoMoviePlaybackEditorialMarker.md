# src/production/IAutoMoviePlaybackEditorialMarker.ts#IAutoMoviePlaybackEditorialMarker

## @evidence contracts/development/design.md#principled-representation

Inherited endpoints preserve the authored source range. Retained endpoints report the rounded intersection with the trim. Output endpoints use entry placement and rate, extending a range that covers a positive collapsed source interval across its played duration. Point markers have equal endpoints on each clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Uses the source marker's identity and label and adds only playback identity and retained/output endpoints.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A replay keeps its own entry index and a clipped range never replaces its original authored endpoints.

## @evidence contracts/development/common.md#meaningful-documentation

Defines entry and shot identity and distinguishes authored, retained source and output time in seconds.
