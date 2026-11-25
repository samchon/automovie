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
