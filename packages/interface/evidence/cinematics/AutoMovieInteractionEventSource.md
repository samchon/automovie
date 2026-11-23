# src/cinematics/AutoMovieInteractionEventSource.ts#AutoMovieInteractionEventSource

## @evidence contracts/development/design.md#principled-representation

Models provenance as a closed string union whose four members are exactly the values `compileLaunch`, `handoffEvents` and the three sampling detectors write, and the shot artifact validator checks a stored source against the same four values.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Provenance is kept separate from `AutoMovieInteractionEventKind`, so one kind can come from several producers and a consumer filters on either axis without parsing ids.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each producer writes its own fixed source, so a sampled contact is never labelled as solved, and the union carries no catch-all value.

## @evidence contracts/development/common.md#meaningful-documentation

States that the value names the producer and why, and for every member which producer writes it and what event it describes.
