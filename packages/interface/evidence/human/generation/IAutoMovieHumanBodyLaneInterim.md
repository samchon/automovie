# src/human/generation/IAutoMovieHumanBodyLaneInterim.ts#IAutoMovieHumanBodyLaneInterim

## @evidence contracts/development/common.md#meaningful-documentation

Describes resolved trunk, neck and limb source inputs consumed by the interim body lane; nested declarations retain their units, frames, optional states and callback contracts.

## @evidence contracts/development/design.md#principled-representation

Resolved trunk, neck and limb source inputs consumed by the interim body lane. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these dependency-free exchange types for AutoMovieHumanBodyLaneInterim; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups the existing BodyLaneInterim contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.

# src/human/generation/IAutoMovieHumanBodyLaneInterim.ts#IAutoMovieHumanBodyLaneInterim.IInput

## @evidence contracts/development/common.md#meaningful-documentation

What the interim lane reads.

## @evidence contracts/development/design.md#principled-representation `solution`: The same canonical solved placement, including its actual neck owner. `params`: The public input. `scale`: Calibration millimetres per world millimetre.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanBodyLaneInterim.of.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `solution`, `params`, `scale`, `stature`, `crotch`, `trunk`, `neckConnection`, `sources`, `frame`; callers supply the complete record.
