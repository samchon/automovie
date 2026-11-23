# src/sound/analyzeProductionSound.ts#analyzeProductionSound

## @evidence contracts/development/common.md#meaningful-documentation

Reports peak, near silence, gated loudness and mixed-master event alignment in production sample/frame units.

## @evidence contracts/development/implementation.md#principled-implementation

Scans the master, applies the fixed 48 kHz loudness filter and observes mixed peaks within one frame of expected events.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Keeps analysis and its filter together, using the mixer's sample boundary map to evaluate alignment.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Mixed peaks do not isolate an event, and this loudness estimate does not certify external conformance.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(N) loudness and peak scans plus one frame radius of samples per event, with O(N) loudness filter storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All event measurements read the same limited PCM buffer and boundary map.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrows the PCM buffer and returns only the measurements, with the filter scratch released on return.
