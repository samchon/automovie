# src/fluid/sampleFluidSpray.ts#sampleFluidSpray

## @evidence contracts/development/implementation.md#principled-implementation

Uses seeded index jitter and closed-form ballistic age, with nozzle height from the current supplied depth rather than spawn history. Vector3.length avoids many square overflow/underflow cases through Math.hypot fallback, but a finite axis can still have an unrepresentable norm; index, jitter and position arithmetic have no separate finite gate.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The public function owns domain-id and distance checks, emit owns one emitter's live window/LOD/cap, and jitter owns direction; decorative sampling does not mutate the solver's depth field.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Negative distance is clamped to the nearest LOD and age is clamped at zero after rounded spawn-window arithmetic. These apply uniformly rather than selecting fixtures; unsafe/non-finite index and direction outcomes remain unresolved, and the age clamp is not a complete lifetime-error bound.

## @evidence contracts/development/common.md#meaningful-documentation

Gives the ballistic law, current-state nozzle choice, seeded direction, LOD/cap/order, exact identity and distance checks, caller admission and unchecked derived-value limits.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each emitter jumps directly between kept stride multiples newest-first, stops after maxParticles appends and reverses only those survivors. With admitted integer caps, work/storage are O(emitters + returned particles) and O(returned particles), bounded by summed caps even when floating-point indices lose progress; correctness of distinct live indices still requires representable arithmetic.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

No cross-call cache or random stream is owned; unchanged domain, full state and camera distance reproduce this operation order, while equal step/id alone does not prove those mutable inputs equivalent.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the returned sample owns at most `maxParticles` particles per emitter, and the per-emitter scratch list dies with the call.
