# src/render/draw/IAutoMovieDrawnVideoResult.ts#IAutoMovieDrawnVideoResult

## @evidence contracts/development/design.md#principled-representation

Failed drawing/writing/encoding rejects without returning partial success; prior files remain host-owned. The optional `sound` exists only when the subject declared a sound list, so its absence means the soundtrack, if any, came from the host.

## @evidence contracts/development/design.md#minimal-and-owned-surface

renderAutoMovieDrawnVideo returns one receipt per written frame, the encoder arguments, any audit of the drawn samples and the mixed soundtrack's identity and, for a subject with a cut, each entry's live output frames and, with control passes, each channel's convention and frame digests, which the CLI writes to `render-report.json`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Failed drawing/writing/encoding rejects without returning partial success; prior files remain host-owned.

## @evidence contracts/development/common.md#meaningful-documentation

Successful sequential beauty capture and encoding receipts. renderAutoMovieDrawnVideo returns after the host encoder resolves, with one receipt per written frame, the actual encoder arguments and the soundtrack mixed from a sound list. The prose and members document how renderAutoMovieDrawnVideo interprets and admits these values.

# src/render/draw/IAutoMovieDrawnVideoResult.ts#IAutoMovieDrawnVideoResult.ISound

## @evidence contracts/development/common.md#meaningful-documentation

States the soundtrack file, the digest form, the per-line receipt digests in list order, that the analysis precedes 16-bit quantization, the loudness record the delivery audit checks against, and the lip-sync entries whose failed verdict blocks publication.

## @evidence contracts/development/design.md#principled-representation

Byte identities use the `sha256:` form of every other digest; the receipts list keeps the sound list's order so a report reads against the list.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The render produces it and the CLI report consumes every member; the analysis is the engine's own record, imported from its owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No member restates the sound list; the report keeps only what proves which bytes were mixed and how loud the result is.
