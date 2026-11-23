# src/production/effect/IAutoMovieProductionFilmEffectSample.ts#IAutoMovieProductionFilmEffectSample

## @evidence contracts/development/design.md#principled-representation

Pairs a validated runtime with the result of `sampleCompiledEffect` at `frame * denominator / numerator` seconds, the same exact boundary time the materializer used for the stream's `start` and `end`, so frame ownership and sampling agree.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Keeps the runtime beside its sample so a viewer can draw the particles and still name the cue, zone and identity they came from without a second lookup by index.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Inactive effects are not filtered out, so the result length always equals the input population and a consumer cannot mistake a dropped stale entry for an idle one.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer, the one-per-input order, that validation and identity matching precede it, the exact sampling time, and that an out-of-interval frame still yields an inactive entry.
