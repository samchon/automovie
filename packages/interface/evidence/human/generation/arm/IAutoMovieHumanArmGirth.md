# src/human/generation/arm/IAutoMovieHumanArmGirth.ts#IAutoMovieHumanArmGirth

## @evidence contracts/development/common.md#meaningful-documentation

Describes ordered walk-station and girth pairs in millimetres, with held end values; nested declarations retain their units, frames, optional states and callback contracts.

## @evidence contracts/development/design.md#principled-representation

Ordered walk-station and girth pairs in millimetres, with held end values. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these dependency-free exchange types for AutoMovieHumanArmGirth; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups the existing ArmGirth contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.

# src/human/generation/arm/IAutoMovieHumanArmGirth.ts#IAutoMovieHumanArmGirth.KnotsResult

## @evidence contracts/development/common.md#meaningful-documentation

Ordered [walk station, girth] pairs in millimetres. A shared span boundary appears once.

## @evidence contracts/development/design.md#principled-representation

Ordered [walk station, girth] pairs in millimetres. A shared span boundary appears once.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanArmGirth.KnotsResult is the canonical exchange used by AutoMovieHumanArmGirth.knots.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The alias retains the existing AutoMovieHumanArmGirth input/result boundary and its documented ordering, units and absence states; it introduces no fixture-specific branch or widened escape type.

# src/human/generation/arm/IAutoMovieHumanArmGirth.ts#IAutoMovieHumanArmGirth.AtList

## @evidence contracts/development/common.md#meaningful-documentation

Borrowed [walk station, girth] knots in increasing station order, both in millimetres. The reader holds the first and last girths outside the knot interval.

## @evidence contracts/development/design.md#principled-representation

Borrowed [walk station, girth] knots in increasing station order, both in millimetres. The reader holds the first and last girths outside the knot interval.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanArmGirth.AtList is the canonical exchange used by AutoMovieHumanArmGirth.at.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The alias retains the existing AutoMovieHumanArmGirth input/result boundary and its documented ordering, units and absence states; it introduces no fixture-specific branch or widened escape type.
