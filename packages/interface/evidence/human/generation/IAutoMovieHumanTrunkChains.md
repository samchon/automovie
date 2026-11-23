# src/human/generation/IAutoMovieHumanTrunkChains.ts#IAutoMovieHumanTrunkChains

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the AutoMovieHumanTrunkChains exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.

## @evidence contracts/development/design.md#principled-representation

A type-only namespace groups ISampling, BuildResult. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these declarations used by Human's AutoMovieHumanTrunkChains; Human retains the computation and source preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace only qualifies the ISampling, BuildResult contracts and adds no alternate implementation, optional mode or runtime state.

# src/human/generation/IAutoMovieHumanTrunkChains.ts#IAutoMovieHumanTrunkChains.ISampling

## @evidence contracts/development/common.md#meaningful-documentation

The chains' sampling: uniform phases of each ring and the phase rule.

## @evidence contracts/development/design.md#principled-representation `samples`: Uniform phases of the chains' rings. `rule`: Phase correspondence rule.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanTrunkChains.build.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `samples`, `rule`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanTrunkChains.ts#IAutoMovieHumanTrunkChains.BuildResult

## @evidence contracts/development/common.md#meaningful-documentation

The chains.

## @evidence contracts/development/design.md#principled-representation

The chains. Ordered tuple slots are 0, 1; fixed arity preserves their correspondence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanTrunkChains.BuildResult is the canonical exchange used by AutoMovieHumanTrunkChains.build.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanTrunkChains.build for the chains.
