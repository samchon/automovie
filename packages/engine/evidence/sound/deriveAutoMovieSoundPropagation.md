# src/sound/deriveAutoMovieSoundPropagation.ts#deriveAutoMovieSoundPropagation

## @evidence contracts/development/implementation.md#principled-implementation

Finite nonnegative distance and a positive speed/fps feed distance/speed and one nearest-frame rounding; softened inverse-square gain and optional dB/metre attenuation follow the selected profile. Binary64 products can overflow to zero gain or underflow, and this is a declared approximation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The pure propagation owner keeps emission independent of audible arrival and preserves the production's carry/trim boundary choice for the mixer.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Out-of-film arrival and unsupported numeric/profile choices throw; spectral none remains null instead of fabricated attenuation, and authored assumptions are required rather than inferred from a scene name.

## @evidence contracts/development/common.md#meaningful-documentation

States metres, safe whole-frame bounds, exclusive segment/film ends, arrival rounding and closed carry/trim/no-spectral meanings; this derives no room response or occlusion.

## @evidence contracts/development/implementation.md#efficient-algorithms

A assumptions require O(A) string validation; delay/gain/spectral calculations and the fresh result have constant scalar cost/storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One computed arrival and distance feed the returned receipt consumed by the mix; changed profile or clock inputs require a new derivation rather than a retained stateful propagation cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The result transfers to the caller by value; the profile/request is not retained and no acoustic device, host handle or scheduled arrival task is acquired.
