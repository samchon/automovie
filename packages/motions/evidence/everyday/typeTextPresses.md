# src/everyday/typeTextPresses.ts#typeTextPresses

## @evidence contracts/development/common.md#meaningful-documentation

States local/world frames, the ordered-time premise, the reach and lift shares and how a short gap shares them, with world-metre output at any second.

## @evidence contracts/development/implementation.md#principled-implementation

Per-hand press records, each with its reach start, press, lift end and the key it comes from; the reader finds the first press whose lift has not ended and evaluates its transport, descent or lift on minimum-jerk profiles in the keyboard frame. A lift never outlasts the gap to the hand's next press, so no reading jumps between keys.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass per hand prepares its records; the reader owns the binary selection and the three path formulas.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The shares are the law's named constants and a short gap scales them, never clips a press time. NaN seconds return the last key's hover. Strictly increasing times and a positive interval are supplied by typeText's skill timing.

## @evidence contracts/development/implementation.md#efficient-algorithms

Preparing N keys costs O(N) time and space; each hand read searches its H ordered presses in O(log H) time and performs one fixed-size path evaluation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Hand assignment, press times, previous keys, reach and lift spans and the keyboard frame's coefficients are prepared once per typing plan; transport, lift and world position are evaluated per reading without a sampled-frame cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned reader owns two arrays holding N press records and the prepared keyboard frame, borrowing the plan's key and home vectors until that plan is released; nothing grows during playback or seeking.
