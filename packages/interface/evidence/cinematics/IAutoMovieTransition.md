# src/cinematics/IAutoMovieTransition.ts#IAutoMovieTransition

## @evidence contracts/development/design.md#principled-representation `playbackLayersAt` weighs the previous entry's tail and the live entry by the elapsed fraction of the overlap `sequenceTimeline` created by pulling the entry forward: a linear mix for `crossDissolve`, and for `fade` the outgoing tail alone falling to black over the first half and the incoming shot alone rising from black over the second, the dip to black an editor's fade between two shots makes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A style tag and a length are all the edit needs; the overlap placement and both layers' weights are derived from them by the timeline and `playbackLayersAt` instead of being stored per entry.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each kind has one weighting for every entry, stated here, and an over-long transition is refused rather than shortened.

## @evidence contracts/development/common.md#meaningful-documentation

States the overlap semantics, the refusals, both kinds' layer weights over the overlap, the black midpoint of a fade and what a fade falls to over a transparent background.
