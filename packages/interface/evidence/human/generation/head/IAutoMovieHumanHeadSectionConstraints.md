# src/human/generation/head/IAutoMovieHumanHeadSectionConstraints.ts#IAutoMovieHumanHeadSectionConstraints

## @evidence contracts/development/common.md#meaningful-documentation

Describes four signed-guide magnitudes in front/left/back/right order, calibration millimetres; nested declarations retain their units, frames, optional states and callback contracts.

## @evidence contracts/development/design.md#principled-representation

Four signed-guide magnitudes in front/left/back/right order, calibration millimetres. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these dependency-free exchange types for AutoMovieHumanHeadSectionConstraints; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups the existing HeadSectionConstraints contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.

# src/human/generation/head/IAutoMovieHumanHeadSectionConstraints.ts#IAutoMovieHumanHeadSectionConstraints.Extents

## @evidence contracts/development/common.md#meaningful-documentation

Four signed-guide magnitudes, front/left/back/right, calibration mm.

## @evidence contracts/development/design.md#principled-representation

Four signed-guide magnitudes, front/left/back/right, calibration mm. Ordered tuple slots are 0, 1, 2, 3; fixed arity preserves their correspondence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanHeadSectionConstraints.lateral, AutoMovieHumanHeadSectionConstraints.frontal, AutoMovieHumanHeadSectionConstraints.radius.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanHeadSectionConstraints.lateral, AutoMovieHumanHeadSectionConstraints.frontal, AutoMovieHumanHeadSectionConstraints.radius, AutoMovieHumanHeadSectionConstraints.admit for four signed-guide magnitudes, front/left/back/right, calibration mm.
