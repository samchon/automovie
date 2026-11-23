# src/human/generation/IAutoMovieHumanGlutealFrame.ts#IAutoMovieHumanGlutealFrame

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the AutoMovieHumanGlutealFrame exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.

## @evidence contracts/development/design.md#principled-representation

A type-only namespace groups IInput. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these declarations used by Human's AutoMovieHumanGlutealFrame; Human retains the computation and source preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace only qualifies the IInput contracts and adds no alternate implementation, optional mode or runtime state.

# src/human/generation/IAutoMovieHumanGlutealFrame.ts#IAutoMovieHumanGlutealFrame.IInput

## @evidence contracts/development/common.md#meaningful-documentation

What the frame reads.

## @evidence contracts/development/design.md#principled-representation `apex`: The buttock point on the wall, `[x, y, z]`, mm. `tangent`: The wall's section tangent at the apex in `[x, z]`, in the direction of rising phase (back: z falling).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanGlutealFrame.create.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `apex`, `tangent`; callers supply the complete record.
