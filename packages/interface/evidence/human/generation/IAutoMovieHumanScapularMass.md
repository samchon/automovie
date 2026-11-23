# src/human/generation/IAutoMovieHumanScapularMass.ts#IAutoMovieHumanScapularMass

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the AutoMovieHumanScapularMass exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.

## @evidence contracts/development/design.md#principled-representation

A type-only namespace groups IInput. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these declarations used by Human's AutoMovieHumanScapularMass; Human retains the computation and source preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace only qualifies the IInput contracts and adds no alternate implementation, optional mode or runtime state.

# src/human/generation/IAutoMovieHumanScapularMass.ts#IAutoMovieHumanScapularMass.IInput

## @evidence contracts/development/common.md#meaningful-documentation

What the mass reads.

## @evidence contracts/development/design.md#principled-representation `centre`: The back wall's point at the centre's lateral place, `[x, y, z]`, mm. `tangent`: The wall's section tangent there in `[x, z]`, in the direction of rising phase (back: z falling). `width`: The section's half width at the centre's height, mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanScapularMass.feature, AutoMovieHumanScapularMass.create.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `centre`, `tangent`, `width`, `span`, `phaseOf`, `base`, `ceiling`; callers supply the complete record.
