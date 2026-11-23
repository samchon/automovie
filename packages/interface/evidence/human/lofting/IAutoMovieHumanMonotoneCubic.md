# src/human/lofting/IAutoMovieHumanMonotoneCubic.ts#IAutoMovieHumanMonotoneCubic

## @evidence contracts/development/common.md#meaningful-documentation

Describes readonly abscissa/value knot pairs supplied to monotone interpolation; nested declarations retain their units, frames, optional states and callback contracts.

## @evidence contracts/development/design.md#principled-representation

Readonly abscissa/value knot pairs supplied to monotone interpolation. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these dependency-free exchange types for AutoMovieHumanMonotoneCubic; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups the existing MonotoneCubic contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.

# src/human/lofting/IAutoMovieHumanMonotoneCubic.ts#IAutoMovieHumanMonotoneCubic.InterpolateKnots

## @evidence contracts/development/common.md#meaningful-documentation

Borrowed [abscissa, value] pairs, at least one, in any order. Units belong to the caller's scalar quantities; the interpolation caller also chooses any minimum abscissa spacing.

## @evidence contracts/development/design.md#principled-representation

Borrowed [abscissa, value] pairs, at least one, in any order. Units belong to the caller's scalar quantities; the interpolation caller also chooses any minimum abscissa spacing.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanMonotoneCubic.InterpolateKnots is the canonical exchange used by AutoMovieHumanMonotoneCubic.interpolate.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The alias retains the existing AutoMovieHumanMonotoneCubic input/result boundary and its documented ordering, units and absence states; it introduces no fixture-specific branch or widened escape type.
