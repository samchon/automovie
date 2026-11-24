# src/sound/renderProductionSound.ts#renderProductionSound

## @evidence contracts/development/implementation.md#principled-implementation

Fixed frame-to-sample owners place event/cue/dialogue boundaries; Float32 accumulation, declared event palette, optional propagation/room receipts, cue unit-rate reading and unit-rate dialogue placement from each line's start tick, refused when the line exceeds its speech span, precede analysis of the exact mix. Each line is levelled as placed by `levelProductionDialogueLine` to the dialogue target `resolveProductionLoudness` gives; the mix has no master stage, which `masterProductionSound` owns, so its analysis counts samples outside [−1, 1].

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The pure mix receives adopted mono buffers through identity maps, keeping decoding and byte provenance outside engine arithmetic; unavailable room receipts throw, and render's film sound route calls it for every delivered soundtrack mixed from a sound list.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Missing cue assets produce procedural bus stand-ins and missing dialogue is omitted. Event alignment measures a mixed-master peak within one frame, so another sound can satisfy it; it is not isolated event energy or causal evidence.

## @evidence contracts/development/common.md#meaningful-documentation

Documents trim/source clocks, optional adopted buffers, dialogue levelling, the loudness targets, the absent master stage and fallback effects; fixed 48kHz stereo and admitted plan quantities are type/caller premises, and trigonometric rounding is not a universal cross-host byte certificate.

## @evidence contracts/development/implementation.md#efficient-algorithms

N master samples plus summed event/cue/dialogue durations drive mixing; each room-response event also allocates/scans a film-length dry buffer and sparse taps, each line adds one placed copy and one meter pass over its own samples, and event windows add O(E*sampleRate/fps) work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Cue ranges are calculated once, adopted buffers are validated once per referenced id and per-event gains are shared across samples; the selected tone owner evaluates only the event's expression rather than every palette formula per sample.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns fresh master/analysis; dry, responded and line-measurement arrays leave scope after completion/failure, with film-duration-driven storage and no decoder, process, audio device or completed-mix cache.
