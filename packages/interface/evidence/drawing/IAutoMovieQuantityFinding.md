# src/drawing/IAutoMovieQuantityFinding.ts#IAutoMovieQuantityFinding

## @evidence contracts/development/design.md#principled-representation

Owner accumulations round to six decimals, sort by value descending then id, and feed total and omitted suffix sums before final rounding. The contributor limit does not change the total; binary64 summation and rounding mean reconciliation is numerical rather than exact algebra, with overflow refused later by canonical encoding.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One finding per subject carries the unit, basis and approximation once, with a bounded owner list and two remainder fields, so a reader reconciles a subject without another lookup.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The basis is fixed per subject by the measurement and the approximation text is the constant `AUTOMOVIE_QUANTITY_CELL_UNION_APPROXIMATION`, rather than a hedge chosen per design, and an owner beyond the bound is counted instead of discarded.

## @evidence contracts/development/common.md#meaningful-documentation

States the total's coverage, the contributor bound and its remainder, and the per-subject basis; members give the unit's scope, the owner count, when `approximation` is `null`, the contributor order and tiebreak, and what the two remainder fields count.
