# src/geometry/IAutoMovieProjectionIntervals.ts#IAutoMovieProjectionIntervals

## @evidence contracts/development/design.md#principled-representation

Every subtraction, product and sum is widened to its adjacent binary64 neighbours, and the norm is raised until its rounded-down square covers the outward squared norm, so each true projection lies inside its interval and the true norm never exceeds `normUpper`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Intervals plus one norm bound is the shared input of projection separation and attachment contact, which compare interval ends and divide by the norm themselves, so neither recomputes the enclosure arithmetic.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No spatial tolerance widens an interval; the only widening is one ulp per rounded operation, and a zero direction reports a zero norm that its consumers treat as no proof.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer, the projection's reference point and scaling, the unit and its norm range, what `normUpper` bounds and why, and the zero-direction result.
