# src/film/staging/validateCameraDepthPrecision.ts#validateCameraDepthPrecision

## @evidence contracts/development/implementation.md#principled-implementation

Bounds the bit count by exact representability of the largest zero-based code index used by the depth-precision evaluator rather than an arbitrary hardware list. That index is also the number of adjacent code intervals, while the number of distinct codes is 2^bits. The authored tolerance contract requires a strictly positive step; this input policy does not imply that every evaluated interval has positive error, since a point interval at the near plane can report zero.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One validator for the camera's depth-precision field, called by `validateStageCamera` beside the other camera checks, so the evaluator downstream can assume both numbers are usable.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No camera or bit depth is special-cased and nothing is defaulted; a missing requirement is a type violation because the scene camera must state one.

## @evidence contracts/development/common.md#meaningful-documentation

States the accepted shape, both bounds with their meaning and units, the 53-bit ceiling and its reason, why values are unknown, and the reported paths.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Two field checks in constant time, with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Checks one camera's requirement per call and coordinates no work across calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing itself; it appends at most two violations per call to `out`, which the caller owns.
