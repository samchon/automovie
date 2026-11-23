# src/compose/AutoMovieMotionHumanArmRetimed.ts#AutoMovieMotionHumanArmRetimed

## @evidence contracts/development/common.md#meaningful-documentation

States what is carried, how each knot is placed and when nothing is returned.

## @evidence contracts/development/implementation.md#principled-implementation

A piecewise-linear change of the time axis per phrase, which leaves the path in the coordinates unchanged; the result is only a start, admitted anew by the solve that takes it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One map of the knots' seconds and one order check.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The coordinates and the penalty are handed on untouched; no knot is dropped or merged to force an order.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the knots.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its two records.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh record that borrows the earlier coordinates and retains nothing.
