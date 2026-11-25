# src/audit/AutoMovieMotionHumanAuditSpin.ts#AutoMovieMotionHumanAuditSpin.measure

## @evidence contracts/development/common.md#meaningful-documentation

States each input with its unit and the failure.

## @evidence contracts/development/implementation.md#principled-implementation

An interval's turn is compared with the mean of its two neighbours', which a constant angular acceleration leaves equal; what departs is bisected toward the half that turns more, until the larger half's excess over half the interval's turn falls like a smooth turn's (fourfold a halving, against a snap's constant half) below half the limit.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The grid pass decides, the bisection measures.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A resolved turn below the limit is not reported, so the reading is zero exactly when no snap of that size exists.

## @evidence contracts/development/implementation.md#efficient-algorithms

Grid poses are resolved once; inner poses once per interval.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The grid is `AutoMovieMotionHumanAuditMotion.grid`.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Inner poses live in one interval's map.
