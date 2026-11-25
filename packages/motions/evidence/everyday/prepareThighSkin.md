# src/everyday/prepareThighSkin.ts#prepareThighSkin

## @evidence contracts/development/common.md#meaningful-documentation

Defines the bone-local ray, world-metre result and owning seated thigh fit.

## @evidence contracts/development/implementation.md#principled-implementation

Lifts the unchanged rigid bone frame to identity and uses the canonical placement and cast; rigid action carries the hit into world coordinates.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One surface and one placement define each ray; the returned reader only applies a current rigid frame.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps the support radius, cast length and original surface-point fallback; hand depth stays with the current hand reach.

## @evidence contracts/development/implementation.md#efficient-algorithms

One bounded collider search per prepared thigh and constant transform work per sample.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only the fixed thigh-local ray and collider share preparation; current thigh articulation remains live.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Each returned reader retains a single geometric point, without posing data or sampled answers.
