# src/measureAutoMovieGeometryEffect.ts#measureAutoMovieGeometryEffect

## @evidence contracts/development/implementation.md#principled-implementation

Selects the active cue in the named zone or its sole inactive cue, samples particles from its recipe, intersects the camera ray with the bounds by slab intervals, and estimates density times path length times maximum opacity.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The effect branch owns cue admission and summaries; deterministic particle sampling, camera placement and actor root resolution stay in existing shared helpers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Missing/ambiguous cues and invalid shot time refuse; subject lists are limited to 256 unique ids. Parallel ray axes use a 1e-12 zero-direction tolerance and bounds admission belongs to compiled effect validation.

## @evidence contracts/development/common.md#meaningful-documentation

States shot-local time, scalar risk interpretation, subject-root scope and named failure; the returned digest identifies the sampled compiled cue.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cue/camera lookup and bounded deterministic particle sampling dominate work; each requested subject adds actor lookup and spatial sampling, while ray-box intersection examines three axes.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One effect sample supplies activity, particle count, intensity and opacity fields; one resolved camera supplies distance and ray, with no cache over mutable compiled cues.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Particle samples and reader closures are call-local and bounded by the recipe's particle budget and 256 subjects; only scalars escape and no renderer resources are acquired.
