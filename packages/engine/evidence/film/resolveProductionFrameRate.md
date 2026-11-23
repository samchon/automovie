# src/film/resolveProductionFrameRate.ts#resolveProductionFrameRate

## @evidence contracts/development/implementation.md#principled-implementation

Reduces the rational with the greatest common divisor through `canonicalProductionFrameRate`, then requires the scalar to equal the double nearest the reduced quotient, so the two spellings can never name different rates and frame-to-time arithmetic runs on integers.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The single reader of the two rate fields for the film timeline, the frame sampler, the effect timeline, sound rendering and the render planner, so every consumer resolves the same identity and the same refusal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No rate is special-cased: the NTSC family and integer rates go through the same reduction and the same equality, and a mismatch throws instead of preferring one field.

## @evidence contracts/development/common.md#meaningful-documentation

States which field wins, the scalar-only rule, why fractional rates must be explicit, the accepted record kinds, and every failure.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One Euclidean reduction, logarithmic in the smaller term, and one division, with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Resolves one record per call; callers that sample many frames resolve it per frame, which is constant work on two integers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates the returned pair only and retains nothing.
