# src/createViewerDisplaySave.ts#createViewerDisplaySave

## @evidence contracts/development/implementation.md#principled-implementation

Structured-clones completed metadata and copies original canvas pixels before PNG encoding, then posts the committed session/generation and monotone local sequence to the actual /display sink; copied facts/pixels must belong to one completed display, and synchronous success does not certify retain/encode/network completion.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns browser bitmap/encoding/upload lifetime and delegates preparation/commit authority to createViewerDisplayPublication; optional paint and retain ports preserve existing visible-layer and graphics-recovery owners without a parallel render or solver.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Saves actual copied pixels/metadata rather than a synthetic probe or fixture PNG; refused snapshot preserves the previous pending bitmap, and asynchronous failures are surfaced as AUTOMOVIE display-save warnings instead of a false saved receipt.

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes provisional copy, committed upload, async failure and independent original-pixel retention; one-running/one-pending population and superseded-surface release are explicit.

## @evidence contracts/development/implementation.md#efficient-algorithms

Copy/PNG/base64 serialization are O(frame pixels or encoded bytes plus cloned metadata); one encoder/upload runs while only latest pending bitmap survives, preventing a frame-per-draw backlog. Driver/browser serialization and network costs remain real work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Prepared original copy is reused by commit, successive pending copies replace superseded surfaces, and the running result is retained for graphics recovery; different completed pixels/facts require a new original snapshot rather than a metadata-only equivalence claim.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Owns at most one running surface/blob/data URL and one pending surface/facts, bounded by their raster/encoded sizes. Release discards pending pixels, aborts the owned FileReader and fetch and closes publication authority. Native toBlob cannot be canceled; its callback is awaited without starting later work after disposal.
