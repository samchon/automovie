# src/render/filmResponse/admitAutoMovieFilmOptics.ts#admitAutoMovieFilmOptics

## @evidence contracts/development/common.md#meaningful-documentation

The doc comment states the input units and frames, the cited method, the output and every refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Checks each range IAutoMovieFilmOptics states in field order and throws on the first refusal, naming the second and the field. The kelvin range is the domain of the Planckian approximation the balance uses; the glare, grade, shutter and lens ranges are the contract's, and the sample count must accompany a shutter or a lens and nothing else, because samples exist only to integrate them.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One admission owns every optics range; the stage calls it before any draw, and the response matrix and CPU reference take admitted optics as their premise.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No value is clamped or replaced; a refused value throws instead of drawing a different response.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work: a fixed number of field checks and no allocation on success.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Nothing is cached; the film returns its optics per second, so every draw admits its own value.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing and opens no handle; the error belongs to the caller.
