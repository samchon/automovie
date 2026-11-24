# src/film/flame/sampleAutoMovieFlame.ts#sampleAutoMovieFlame

## @evidence contracts/development/common.md#meaningful-documentation

States each size kind's meridian, displacement, sway or puffing law, their sources and provisional amounts, and the silhouette area's definition.

## @evidence contracts/development/implementation.md#principled-implementation

Revolves a closed meridian with revolveAutoMovieProfile after displacing it by seeded gradient noise whose domain falls with time so features rise; an open fire's height follows Heskestad and pulses at the Cetegen and Ahmed puffing frequency; a small flame only sways, as an isolated candle burns steadily (Kitahata et al. 2009). The area is twice the trapezoid integral of the same meridian the mesh revolves.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One closed-form sampler that both the light coupling and render read, so the drawn shape and the light's flicker come from the same profile.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The ripple, sway, puff and glow amounts are named provisional estimates; no state is kept between samples, so nothing depends on sampling order.

## @evidence contracts/development/implementation.md#efficient-algorithms

Sixteen meridian samples and twenty-four segments per call; one revolve.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call evaluates one time; callers that need a grid sample it explicitly.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new mesh and number; nothing is retained.
