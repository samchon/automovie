# src/human/generation/foot/IAutoMovieHumanFootHeads.ts#IAutoMovieHumanFootHeads

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the AutoMovieHumanFootHeads exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.

## @evidence contracts/development/design.md#principled-representation

A type-only namespace groups IHeads. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these declarations used by Human's AutoMovieHumanFootHeads; Human retains the computation and source preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace only qualifies the IHeads contracts and adds no alternate implementation, optional mode or runtime state.

# src/human/generation/foot/IAutoMovieHumanFootHeads.ts#IAutoMovieHumanFootHeads.IHeads

## @evidence contracts/development/common.md#meaningful-documentation

The heads and their mean.

## @evidence contracts/development/design.md#principled-representation `heads`: Head centres, hallux first, left frame. `ball`: Mean of the heads, left frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanFootHeads.of. Also types AutoMovieHumanFootBones.heads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `heads`, `ball`; callers supply the complete record.
