# src/drawing/roundAutoMovieDrawingScalar.ts#roundAutoMovieDrawingScalar

## @evidence contracts/development/implementation.md#principled-implementation

Scales by a power of ten, rounds with `Math.round` and scales back, the standard fixed-decimal rounding; the limitation is that binary floating point cannot hold most decimal fractions exactly, so the result is the nearest double to the grid value, which is stable across runs and machines because every step is IEEE-754 exact rounding.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One rounding rule for every coordinate, length, area and welding key in the drawing folder, so two derivations of one design produce one set of numbers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No value is special-cased; the negative-zero normalization follows from `Object.is` distinguishing the two zeros, not from a particular fixture.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the precision, the tie rule, the negative-zero normalization and why it matters, and the never-`-0` result.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A multiplication, a rounding and a division, so there is no algorithm to choose; the factor is computed once at module load.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One multiply, round and divide per value; memoizing scalars would grow a table without bound to save three operations.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Works on one number and a module constant fixed at load, so there is no per-call state to bound or free.
