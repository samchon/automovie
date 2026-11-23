# src/human/generation/IAutoMovieHumanGlutealRelief.ts#IAutoMovieHumanGlutealRelief

## @evidence contracts/development/common.md#meaningful-documentation

Describes the gluteal mass, original trunk surface and lateral-to-material-phase lookup used by relief composition; nested declarations retain their units, frames, optional states and callback contracts.

## @evidence contracts/development/design.md#principled-representation

The gluteal mass, original trunk surface and lateral-to-material-phase lookup used by relief composition. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these dependency-free exchange types for AutoMovieHumanGlutealRelief; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups the existing GlutealRelief contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.

# src/human/generation/IAutoMovieHumanGlutealRelief.ts#IAutoMovieHumanGlutealRelief.IInput

## @evidence contracts/development/common.md#meaningful-documentation

What the merge reads.

## @evidence contracts/development/design.md#principled-representation `dome`: The gluteal mass. `base`: The trunk's base surface: the body point at a height and a phase. `phaseOf`: The base's phase at a lateral place on the back at the buttock point's height.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanGlutealRelief.create.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `dome`, `base`, `phaseOf`; callers supply the complete record.
