# src/schema/IAutoMovieHumanBuildTraitsSchema.ts#IAutoMovieHumanBuildTraitsSchema

## @evidence contracts/development/common.md#meaningful-documentation

The declaration explains the neutral reference and identifies four separately authored directions. Each field retains its own positive and negative meaning.

## @evidence contracts/development/design.md#principled-representation

Typia constrains each required offset to [-1, 1]. Their units are dimensionless. Physical measurements require a separately defined mapping, and this schema supplies only the authored offsets.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The introductory traits record reuses these offsets as its build block. Detailed anthropometry and composition carry actual measurements in separate schemas.
