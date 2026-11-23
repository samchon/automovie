# src/human/generation/IAutoMovieHumanBreastFrame.ts#IAutoMovieHumanBreastFrame

## @evidence contracts/development/common.md#meaningful-documentation

Describes the anatomical bust-point position and increasing-phase trunk tangent defining a breast frame; nested declarations retain their units, frames, optional states and callback contracts.

## @evidence contracts/development/design.md#principled-representation

The anatomical bust-point position and increasing-phase trunk tangent defining a breast frame. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these dependency-free exchange types for AutoMovieHumanBreastFrame; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups the existing BreastFrame contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.

# src/human/generation/IAutoMovieHumanBreastFrame.ts#IAutoMovieHumanBreastFrame.IInput

## @evidence contracts/development/common.md#meaningful-documentation

What the frame reads.

## @evidence contracts/development/design.md#principled-representation `apex`: The bust point on the wall, `[x, y, z]`, mm (ISO 8559-1 3.1.11, a bare breast's most anterior point). `tangent`: The wall's section tangent at the apex in `[x, z]`, in the direction of rising phase (front: z rising).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanBreastFrame.create.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `apex`, `tangent`; callers supply the complete record.
