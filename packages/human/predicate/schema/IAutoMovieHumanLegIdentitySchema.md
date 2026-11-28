# src/schema/IAutoMovieHumanLegIdentitySchema.ts#IAutoMovieHumanLegIdentitySchema

## @evidence contracts/development/common.md#meaningful-documentation

The record distinguishes thigh and shank landmark spans, foot and ankle measures and the signed knee extension convention.

## @evidence contracts/development/design.md#principled-representation

Typia checks each required length and mobility range and reuses selected girth bounds from body anatomy. The hip, knee and ankle fields describe separate measurements.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The detailed body identity reuses the record for either leg. The extremity input selects the heel-to-toe length, forefoot breadth and malleolus height from the same definitions.
