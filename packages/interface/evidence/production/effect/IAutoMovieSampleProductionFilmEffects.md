# src/production/effect/IAutoMovieSampleProductionFilmEffects.ts#IAutoMovieSampleProductionFilmEffects.IProps

## @evidence contracts/development/design.md#principled-representation

timelineFrame is a nonnegative safe integer on the full-rate film clock; cameraDistance is finite nonnegative metres. The sampler validates both and validates each persisted runtime before sampling its boundary second.

## @evidence contracts/development/design.md#minimal-and-owned-surface

sampleProductionFilmEffects compares the supplied current identity with every compiled film runtime and returns a cloned runtime beside its sampled state.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An empty effects array yields no samples after identity/frame/distance admission; stale runtimes throw rather than borrowing the current identity.

## @evidence contracts/development/common.md#meaningful-documentation

Current build identity and film frame required to sample persisted effect streams. timelineFrame is a nonnegative safe integer on the full-rate film clock; cameraDistance is finite nonnegative metres. The sampler validates both and validates each persisted runtime before sampling its boundary second.
