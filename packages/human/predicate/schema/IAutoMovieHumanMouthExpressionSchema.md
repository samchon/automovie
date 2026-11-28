# src/schema/IAutoMovieHumanMouthExpressionSchema.ts#IAutoMovieHumanMouthExpressionSchema

## @evidence contracts/development/common.md#meaningful-documentation

The three optional groups describe named lips, tongue position and viseme weights. The declaration explains where clinical jaw input belongs.

## @evidence contracts/development/design.md#principled-representation

Each independently optional group takes its child schema's bounds. The polygon renderer rejects overlaps between named lips and listed actions and reports supplied tongue and viseme groups as unsupported.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The expression record owns when the mouth block exists. Child schemas own channel ranges. Imported render models accept viseme weights through their expression path, independently of the polygon face subset.
