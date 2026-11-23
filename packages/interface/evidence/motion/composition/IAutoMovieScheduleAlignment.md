# src/motion/composition/IAutoMovieScheduleAlignment.ts#IAutoMovieScheduleAlignment

## @evidence contracts/development/common.md#meaningful-documentation

Gives alignment target provenance, occurrence defaults, offsets and all available instants.

## @evidence contracts/development/design.md#principled-representation

The anchor names an earlier intent or cue track and instants use absolute film seconds; offset is seconds, index is a zero-based source-order occurrence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieSchedulePlace passes this richer context only to align before timing the chosen start again.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It extends the ordinary placement context and reuses IAutoMovieScheduleCue rather than introducing another event-time representation.
