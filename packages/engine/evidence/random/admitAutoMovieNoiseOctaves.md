# src/random/admitAutoMovieNoiseOctaves.ts#admitAutoMovieNoiseOctaves

## @evidence contracts/development/common.md#meaningful-documentation

States the range of each parameter, why the roughness stays below one, and that the refusal names the parameter out of range.

## @evidence contracts/development/implementation.md#principled-implementation

An octave count is a positive safe integer and a roughness lies in the open interval (0, 1), as the fractal sum's definition needs: a zero amplitude ratio would drop every finer octave, and a ratio of one or more would not make finer octaves weaker. The negated comparisons also refuse NaN.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shared by the two- and three-dimensional fractal noise so both refuse in the same words.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is clamped or defaulted; an out-of-range value throws.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure check with nothing to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds no state or handle.
