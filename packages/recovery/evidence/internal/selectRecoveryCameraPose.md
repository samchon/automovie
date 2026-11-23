# src/internal/selectRecoveryCameraPose.ts#selectRecoveryCameraPose

## @evidence contracts/development/implementation.md#principled-implementation

Essential decomposition retains both rotations and both translation signs. Original-design triangulation measures each branch's actual depths; the positive-depth maximum is the classical cheirality choice, and the median ray angle conditions its baseline rather than claiming scale or physical truth.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One owner aggregates pair-level geometry into the candidate and all competing counts; its caller must still check a unique winner, positive fraction, pixel errors, parallax and a homography explanation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No expected camera, forced positive point, discarded failed triangulation or tie-breaking pose is presented as unique. Null points remain in the candidate's original observation-order evidence.

## @evidence contracts/development/common.md#meaningful-documentation

States four-branch population, tie meaning, original observation order, finite-positive parallax subset and unit-baseline uncertainty.

## @evidence contracts/development/implementation.md#efficient-algorithms

N pairs require four bounded 4-by-4 triangulations each and median sorting of at most N angles, with O(N) candidate storage rather than retaining four complete point populations.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One essential projection supplies all four poses; each branch's triangulations supply both its depth count and parallax without another reconstruction.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the current best O(N) point evidence and four scalar counts survive; replaced candidates become unreachable, and no image, cache or external handle is retained.
