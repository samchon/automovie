# src/compose/AutoMovieMotionHumanArmStated.ts#AutoMovieMotionHumanArmStated

## @evidence contracts/development/common.md#meaningful-documentation

States the four instants, the hold to the end, the precision and every case with no span.

## @evidence contracts/development/implementation.md#principled-implementation

A weight is a time course of a reach, so its instants are where it crosses its ends; a crossing bracketed by two samples is found by bisection to the precision asked, stopping where the midpoint no longer lies strictly inside the bracket so the loop ends at any magnitude of seconds.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scan for the brackets and one bisection per instant.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A weight with two reaches or none is not given a span: its law states its own (`AutoMovieMotionHumanArmCarry.ICarry.span`).

## @evidence contracts/development/implementation.md#efficient-algorithms

240 samples a second of window and forty-odd reads per instant, once per carry.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Read once per carry by `carried`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
