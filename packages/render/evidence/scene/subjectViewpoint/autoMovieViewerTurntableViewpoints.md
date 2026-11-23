# src/index.ts#autoMovieViewerTurntableViewpoints

## @evidence contracts/development/implementation.md#principled-implementation

Evenly spaces azimuths over 360 degrees and uses a Set to refuse duplicate rounded ids; default distance1.25 is a conventional context margin, not a measured visual quality guarantee.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One plan loop owns names/order; actual subject bounds, lens, rendering and coverage observation stay downstream.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Duplicate labels refuse rather than silently dropping an observation; rounded labels do not distinguish every distinct angle and no scene-specific samples are injected.

## @evidence contracts/development/common.md#meaningful-documentation

Documents ordering, default margin, rounded-name refusal and incomplete finite/population admission.

## @evidence contracts/development/implementation.md#efficient-algorithms

Creates O(E*A) records and identity-set entries for E rings and A azimuths; no redundant search over prior records is needed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each invocation generates fresh records deterministically from its options; a caller can retain an unchanged plan but no render result is reused.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The temporary uniqueness Set leaves scope after return; consumer retention grows with E*A and there is no configured plan-size cap or native handle.
