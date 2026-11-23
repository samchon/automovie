# src/sound/analyzeProductionSound.ts#analyzeProductionSound

## @evidence contracts/development/common.md#meaningful-documentation

Reports sample peak, samples outside [−1, 1], near silence, BS.1770-5 integrated loudness, true peak and mixed-master event alignment in production sample/frame units, and states which pass measures each.

## @evidence contracts/development/implementation.md#principled-implementation

Scans the samples for peak, clipping and silence, measures loudness and true peak with engine's BS.1770-5 meter, and observes mixed peaks within one frame of expected events.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reads loudness through the shared meter, so the mix, the master and the delivered check measure alike; it uses the mixer's sample boundary map to evaluate alignment.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Mixed peaks do not isolate an event, and the meter claims no external conformance certification. Clipping is counted, not assumed absent.

## @evidence contracts/development/implementation.md#efficient-algorithms

One O(N) scan and one O(N) meter pass, plus one frame radius of samples per event; the meter keeps one energy per 100 ms.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All measurements read the same PCM buffer and boundary map.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrows the PCM buffer and returns only the measurements, with the meter released on return.
