# src/cinematics/IAutoMovieInteractionEvent.ts#IAutoMovieInteractionEvent

## @evidence contracts/development/design.md#principled-representation

Each producer writes the time it actually computed or scheduled (a solved landing, the authored handoff instants, a sampled detection), and `appendShotMetadataArtifact` checks a stored event against the closed kind and source unions, a finite time inside `[0, duration + 1e-9]` matching `performShot`'s own landing slack, non-blank participant ids, a finite point, and an integer action index.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One flat record with four nullable participant roles serves every producer, so a consumer reads contacts, handoffs and falls through the same fields instead of one type per kind.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Unknown participants stay null; structural admission checks nonblank participant strings, not their existence or causal truth. It refuses times outside the clock plus its 1e-9 end allowance without clamping. Event-id uniqueness is unchecked, and formatted times or delimiter-containing participant ids can collide.

## @evidence contracts/development/common.md#meaningful-documentation

States the role of each participant field and what `null` means for it, who produces and who consumes the record, the clock and range of `time`, the frame of `point`, and that id uniqueness is not gated.
