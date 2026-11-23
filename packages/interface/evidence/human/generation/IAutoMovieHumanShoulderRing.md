# src/human/generation/IAutoMovieHumanShoulderRing.ts#IAutoMovieHumanShoulderRing

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the AutoMovieHumanShoulderRing exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.

## @evidence contracts/development/design.md#principled-representation

A type-only namespace groups IInput. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these declarations used by Human's AutoMovieHumanShoulderRing; Human retains the computation and source preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace only qualifies the IInput contracts and adds no alternate implementation, optional mode or runtime state.

# src/human/generation/IAutoMovieHumanShoulderRing.ts#IAutoMovieHumanShoulderRing.IInput

## @evidence contracts/development/common.md#meaningful-documentation

What a shoulder ring reads.

## @evidence contracts/development/design.md#principled-representation `column`: The torso's column through the shoulders. `line`: The trapezius line, from the shoulder point to the neck's ring. `oval`: The arm's ellipse and its cap.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanShoulderRing.wall, AutoMovieHumanShoulderRing.controls. Also types AutoMovieHumanTrunkChains.shoulder.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `column`, `line`, `oval`, `axilla`; callers supply the complete record.
