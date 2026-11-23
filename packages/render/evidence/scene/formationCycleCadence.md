# src/scene/formationCycleCadence.ts#formationCycleCadence

## @evidence contracts/development/implementation.md#principled-implementation

Folds engine cue segments in order using each selected take's distance/turn per estimated stride, or elapsed seconds per period for zero-stride takes; finite admitted segment quantities and positive take periods are premises, with absent/unknown gait using this tier's declared fallback and stride remaining a contact heuristic.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Keeps two absolute accumulators and final selected take together so cue changes preserve prior integrated phase without per-member animation clocks or a duplicated gait table selector.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Zero-stride period playback and fallback take are explicit movement/repertoire policies, not asset-name exceptions; no external clock, frame-history compensation or fixture travel distance is read.

## @evidence contracts/development/common.md#meaningful-documentation

Explains distance versus period integration, turn-radius composition, cross-cue continuity and the stride approximation rather than claiming arbitrary exact contact.

## @evidence contracts/development/implementation.md#efficient-algorithms

Visits S segments once with constant-time take Map lookups and two scalar accumulators, O(S) CPU and constant adapter storage independent of anonymous member count.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the cycle's existing take records/textures and folds once per tier update for all members; changed absolute segment input requires reintegration, with no previous-frame accumulation cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a small record borrowing one cycle-owned take and retains no segment/cycle after return; this arithmetic acquires no texture, native task or animation timer.
