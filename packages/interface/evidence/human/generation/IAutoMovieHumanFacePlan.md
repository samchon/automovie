# src/human/generation/IAutoMovieHumanFacePlan.ts#IAutoMovieHumanFacePlan

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the AutoMovieHumanFacePlan exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.

## @evidence contracts/development/design.md#principled-representation

A type-only namespace groups Norms. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these declarations used by Human's AutoMovieHumanFacePlan; Human retains the computation and source preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace only qualifies the Norms contracts and adds no alternate implementation, optional mode or runtime state.

# src/human/generation/IAutoMovieHumanFacePlan.ts#IAutoMovieHumanFacePlan.Norms

## @evidence contracts/development/common.md#meaningful-documentation

3D Facial Norms' means, women and men, mm: cranial base width, middle facial depth, maximum facial width.

## @evidence contracts/development/design.md#principled-representation

3D Facial Norms' means, women and men, mm: cranial base width, middle facial depth, maximum facial width. The outer tuple/array is readonly; nested element types determine whether their contents can change.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanFacePlan.Norms is the canonical exchange used by AutoMovieHumanFacePlan.NORMS.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanFacePlan.NORMS for 3D Facial Norms' means, women and men, mm: cranial base width, middle facial depth, maximum facial width.
