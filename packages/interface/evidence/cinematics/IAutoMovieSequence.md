# src/cinematics/IAutoMovieSequence.ts#IAutoMovieSequence

## @evidence contracts/development/design.md#principled-representation

Each entry adds its played span minus incoming overlap to the output clock. Random-access and forward playback share sample construction and the last-start-at-or-before tie rule; agreement requires an admitted timeline and nondecreasing queries for the stateful cursor.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The sequence is an id, a name, one ordered entry list and a nominal rate; timing is derived on demand rather than stored, so there is no second copy of the timeline to keep consistent.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An invalid cut is refused by `cutSequence` with a path rather than repaired by shortening a transition or clamping a trim, and `sequenceTimeline` throws on an empty list or a missing shot instead of skipping the entry.

## @evidence contracts/development/common.md#meaningful-documentation

States derived timing, admission and layout responsibilities, accumulated-clock finiteness, cursor ordering premises, null names and the distinction between nominal and delivered frame rate.
