# src/human/generation/IAutoMovieHumanTrunkFeatures.ts#IAutoMovieHumanTrunkFeatures

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the AutoMovieHumanTrunkFeatures exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.

## @evidence contracts/development/design.md#principled-representation

A type-only namespace groups ISites, GuardedMake. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these declarations used by Human's AutoMovieHumanTrunkFeatures; Human retains the computation and source preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace only qualifies the ISites, GuardedMake contracts and adds no alternate implementation, optional mode or runtime state.

# src/human/generation/IAutoMovieHumanTrunkFeatures.ts#IAutoMovieHumanTrunkFeatures.ISites

## @evidence contracts/development/common.md#meaningful-documentation

What the features stand on: landmark heights and the tapes that size them.

## @evidence contracts/development/design.md#principled-representation `crotch`: Crotch height, mm. `buttock`: Buttock point height, mm. `iliocristale`: Iliocristale height, mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanTrunkKeys.sites. Read by AutoMovieHumanTrunkFeatures.breastDome, AutoMovieHumanTrunkFeatures.breasts, AutoMovieHumanTrunkFeatures.glutealDome. Also types AutoMovieHumanTrunkClosure.sites, AutoMovieHumanTrunkSolver.where.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `crotch`, `buttock`, `iliocristale`, `omphalion`, `waist`, `fold`, `bust`, `axilla`, `bustSpan`, `projection`, `buttockProjection`, `span`, `neck`.

# src/human/generation/IAutoMovieHumanTrunkFeatures.ts#IAutoMovieHumanTrunkFeatures.GuardedMake

## @evidence contracts/development/common.md#meaningful-documentation

An optional piece's windows, or none and one diagnostic when it breaks its contract.

## @evidence contracts/development/design.md#principled-representation

An optional piece's windows, or none and one diagnostic when it breaks its contract. The callable takes  and returns IAutoMovieLoftRelief[].

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanTrunkFeatures.GuardedMake is the canonical exchange used by AutoMovieHumanTrunkFeatures.guarded.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanTrunkFeatures.guarded for an optional piece's windows, or none and one diagnostic when it breaks its contract.
