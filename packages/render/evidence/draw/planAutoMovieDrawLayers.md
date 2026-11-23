# src/draw/planAutoMovieDrawLayers.ts#planAutoMovieDrawLayers

## @evidence contracts/development/common.md#meaningful-documentation

States the source of the layers, when the result is null, the refusal and what it names.

## @evidence contracts/development/implementation.md#principled-implementation

The layers are the engine's `playbackLayersAt`, the one owner of transition weights, on the subject's own sequence and cut; a single live layer at weight 1 is a direct frame, returned as null so the caller draws it by the calls it always did. An outgoing layer needs the subject's shot placement, so its absence is refused instead of drawing a hard cut where a transition is authored.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shared by the draw page and the interactive viewer, so both plan the same layers at the same second.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No kind, subject or second is special-cased; the refusal names the entry's own transition kind.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(log E) for E entries, the engine's search, plus a scan of at most two layers.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the caller owns the layers.
