# src/drawing/IAutoMovieQuantityContributor.ts#IAutoMovieQuantityContributor

## @evidence contracts/development/design.md#principled-representation `measureAutoMovieQuantities` accumulates each subject's values in a map keyed by owner, so an owner appears once per finding with the sum of everything attributed to it, rounded to six decimals.

## @evidence contracts/development/design.md#minimal-and-owned-surface

An owner id and a value are all a take-off line needs; the unit and basis live once on the enclosing finding instead of being repeated per contributor.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Owner keys are declared entity ids or the open kind labels used for element/opening counts, not uniformly resolvable entity ids. The remainder uses finding-level count/value fields rather than a synthetic contributor, and shared keys accumulate into one owner tally.

## @evidence contracts/development/common.md#meaningful-documentation

States which design id owns each subject's share, that one owner's shares are summed, and the value's unit and rounding.
