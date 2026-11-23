# src/caption/canonicalProductionWebVtt.ts#canonicalProductionWebVtt

## @evidence contracts/development/implementation.md#principled-implementation

The cue syntax follows the W3C WebVTT file grammar: identifiers are preserved verbatim, cue text and annotations are escaped by the shared serializers, and times come from `productionFrameIntervalToGridTicks`, whose BigInt arithmetic maps each rational frame boundary to an exact integer millisecond before formatting. WebVTT counts nonnegative snapped lines from the top and negative snapped lines from the bottom for horizontal cues.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The function only orders cues and assembles lines; identifier refusal, text escaping, language validation, frame-to-tick mapping and timestamp spelling each live in the helper that owns them, so the delivery validator compares against the same bytes the writer emits.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The only fixed values are WebVTT syntax and the 1000-tick millisecond clock WebVTT timestamps require; nothing is special-cased per cue, and a malformed cue throws instead of being skipped.

## @evidence contracts/development/common.md#meaningful-documentation

The doc states the byte-equality role, the header source, the cue order, the millisecond rounding, the placement mapping, the span nesting, and every refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

For C cues of text length L the cost is an O(C log C) sort of a copied array plus O(L) escaping per cue; the copy keeps the caller's timeline unmodified, and the sort is needed because the order is part of the canonical bytes.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call serializes one timeline into a fresh string and coordinates no phases or consumers whose work it could share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the sorted copy and the line array are held, both released on return; the output string, owned by the caller, grows linearly with cue count and text length.
