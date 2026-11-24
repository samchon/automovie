# src/scene/mixAutoMovieStraightAlpha.ts#mixAutoMovieStraightAlpha

## @evidence contracts/development/common.md#meaningful-documentation

States the associated-alpha mix, the fade toward transparency, the opaque identity and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Mixes in associated (premultiplied) colour, the form in which Porter and Duff's compositing algebra is linear, then divides by the mixed alpha; for two opaque pixels the division by 255 returns the straight mix, so opaque films mix as before.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pure byte function the compositor's shader mirrors, so the rule is testable without a GPU.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Colour 0 for alpha 0 is the defined straight value of an empty pixel, not a tuned fallback.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It computes afresh from its arguments; nothing is shared between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It holds no handle, task or state beyond its return value.
