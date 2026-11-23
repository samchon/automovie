# src/human/generation/leg/IAutoMovieHumanLegReliefs.ts#IAutoMovieHumanLegReliefs

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the AutoMovieHumanLegReliefs exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.

## @evidence contracts/development/design.md#principled-representation

A type-only namespace groups OfGirth, OfSpan. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these declarations used by Human's AutoMovieHumanLegReliefs; Human retains the computation and source preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace only qualifies the OfGirth, OfSpan contracts and adds no alternate implementation, optional mode or runtime state.

# src/human/generation/leg/IAutoMovieHumanLegReliefs.ts#IAutoMovieHumanLegReliefs.OfGirth

## @evidence contracts/development/common.md#meaningful-documentation

The reliefs of one leg.

## @evidence contracts/development/design.md#principled-representation

The reliefs of one leg. The callable takes s and returns number.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanLegReliefs.OfGirth is the canonical exchange used by AutoMovieHumanLegReliefs.of.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanLegReliefs.of for the reliefs of one leg.

# src/human/generation/leg/IAutoMovieHumanLegReliefs.ts#IAutoMovieHumanLegReliefs.OfSpan

## @evidence contracts/development/common.md#meaningful-documentation

The reliefs of one leg.

## @evidence contracts/development/design.md#principled-representation

The reliefs of one leg. The outer tuple/array is readonly; nested element types determine whether their contents can change.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanLegReliefs.OfSpan is the canonical exchange used by AutoMovieHumanLegReliefs.of.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanLegReliefs.of for the reliefs of one leg.
