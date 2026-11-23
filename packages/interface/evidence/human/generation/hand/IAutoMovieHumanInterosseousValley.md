# src/human/generation/hand/IAutoMovieHumanInterosseousValley.ts#IAutoMovieHumanInterosseousValley

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the AutoMovieHumanInterosseousValley exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.

## @evidence contracts/development/design.md#principled-representation

A type-only namespace groups IInput. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these declarations used by Human's AutoMovieHumanInterosseousValley; Human retains the computation and source preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace only qualifies the IInput contracts and adds no alternate implementation, optional mode or runtime state.

# src/human/generation/hand/IAutoMovieHumanInterosseousValley.ts#IAutoMovieHumanInterosseousValley.IInput

## @evidence contracts/development/common.md#meaningful-documentation

A valley's fixed inputs.

## @evidence contracts/development/design.md#principled-representation `between`: The two metacarpal axes' places across the hand, mm, the thumb side first. `radius`: The arches' radius, mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanInterosseousValley.depth. Also types AutoMovieHumanPalmRelief.valleys.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `between`, `radius`; callers supply the complete record.
