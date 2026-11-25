# src/human/generation/IAutoMovieHumanTrunkFeatures.ts#IAutoMovieHumanTrunkFeatures.ISites

## @evidence contracts/development/common.md#meaningful-documentation

What the features stand on: landmark heights and the tapes that size them.

## @evidence contracts/development/design.md#principled-representation `crotch`: Crotch height, mm. `buttock`: Buttock point height, mm. `iliocristale`: Iliocristale height, mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanTrunkKeys.sites. Read by AutoMovieHumanTrunkFeatures.breastDome, AutoMovieHumanTrunkFeatures.breasts, AutoMovieHumanTrunkFeatures.glutealDome. Also types AutoMovieHumanTrunkClosure.sites, AutoMovieHumanTrunkSolver.where.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `crotch`, `buttock`, `iliocristale`, `omphalion`, `waist`, `fold`, `bust`, `axilla`, `furrowFrom`, `bustSpan`, `projection`, `buttockProjection`, `span`, `neck`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanTrunkFeatures.ts#IAutoMovieHumanTrunkFeatures.GuardedMake

## @evidence contracts/development/common.md#meaningful-documentation

An optional piece's windows, or none and one diagnostic when it breaks its contract.

## @evidence contracts/development/design.md#principled-representation

An optional piece's windows, or none and one diagnostic when it breaks its contract. The callable takes  and returns IAutoMovieLoftRelief[].

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanTrunkFeatures.GuardedMake is the canonical exchange used by AutoMovieHumanTrunkFeatures.guarded.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanTrunkFeatures.guarded for an optional piece's windows, or none and one diagnostic when it breaks its contract.
