# src/production/IAutoMoviePlaybackLayer.ts#IAutoMoviePlaybackLayer

## @evidence contracts/development/design.md#principled-representation

One drawn shot at an output instant: the entry index on the sequence, the shot-local second on that shot's clock, a dimensionless weight in `[0, 1]` and whether the entry is the live one. The weight range and the ordering, outgoing first, are runtime facts `playbackLayersAt` guarantees.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The draw page and the interactive viewer read every member: `entry` finds the timeline entry whose clock places the layer at a sub-frame second, `shot` and `time` place it, `weight` composites it and `live` chooses between the subject's own `seek` and its shot placement. The interface owns it beside `IAutoMoviePlaybackSample`, which it extends with weights.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No kind or subject is encoded here; a fade and a dissolve differ only by the layers and weights listed, which is what `renderAutoMovieFilmFrame` composites.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer, the order, the layers of a direct frame, a dissolve and a fade, each member's clock or range, and what `live` selects.
