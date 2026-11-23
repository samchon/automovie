# src/film/bakedTransformFromClipsAt.ts#bakedTransformFromClipsAt

## @evidence contracts/development/implementation.md#principled-implementation

Delegates per-channel latest-start authority and interpolation to sampleClipSequence, the playback sampler; requires admitted clips with complete channel values and finite shot time, and only constructs a frame after both translation and rotation have started.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Adapts playback's sampled channel map into the world-frame shape coupling, beat snapshots and camera following consume; missing-channel fallback remains with those callers because their staged placements differ.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Chooses channels by node identity and path, without reading producer ids or coupling suffixes; unit scale follows the attach and launch producers' scale-free output rather than guessing the staged model scale.

## @evidence contracts/development/common.md#meaningful-documentation

Documents independent channel authority, null before both required channels begin, shot-local time and the scale fallback limitation for staged set pieces.

## @evidence contracts/development/implementation.md#efficient-algorithms

Sampling visits every input clip track and interpolates its keys through sampleClipSequence, then performs three map lookups and a constant-size transform assembly; callers supply the relevant object's baked clips where available.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Reads mutable caller-owned clips at one instant and coordinates no requests; reusing a previous map would require clip identity, content and time equivalence that this function does not own.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The sampled map lives only for this call; the returned frame contains scalar copies except the shared unit-scale fallback, which consumers read without modifying.
