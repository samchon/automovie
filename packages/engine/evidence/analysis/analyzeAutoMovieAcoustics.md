# src/analysis/analyzeAutoMovieAcoustics.ts#analyzeAutoMovieAcoustics

## @evidence contracts/development/implementation.md#principled-implementation

Evaluates Sabine reverberation, the room constant with a direct-plus-diffuse receiver level, and tau-weighted composite transmission loss in closed form; each diffuse-field result assumes a diffuse field, so the zero- and full-absorption extremes become gaps, and a negative sound reduction index, which would let a partition transmit more energy than reaches it, is refused.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns the solve and the metric list with private helpers for the per-receiver direct field and the request check; the receiver level is split as the direct term per receiver plus one shared diffuse term, the same sum regrouped so the room-wide part is computed once.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The named 0.161 coefficient selects the Sabine model; the 1e-12-metre coincidence floor is the engine's numerical policy around the inverse-square singularity. Infinite receiver levels become explicit underflow/overflow gaps, while other nonfinite arithmetic can still throw through metric admission; no room, source or receiver id is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states the three closed forms, the unsupported speech index and why, the diffuse-field gaps and why Sabine's anechoic answer is withheld, the energy-range gaps, every throwing condition and when samples exist.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is O(R·S) for R receivers (at most 4096) and S sources, paid once: each source's power `10^(Lw/10)` is computed once instead of per receiver, and the receiver-source distance pass both refuses coincidence and accumulates the direct field; other work is linear in surfaces, partitions and metrics times targets.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Within one study the absorption area and room constant serve the reverberation, room-constant and level metrics, the summed source power serves every receiver's diffuse term, and the receiver levels serve the mean, the maximum and the samples; nothing is shared across studies.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates per-call arrays of S powers and R direct terms and levels, bounded by the receiver limit and the declared sources, and keeps none of them after returning the sealed run, which owns its samples.
