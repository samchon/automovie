# src/motion/IAutoMovieChainFitScore.ts#IAutoMovieChainFitScore

## @evidence contracts/development/common.md#meaningful-documentation

States the score order, angular units, reference-pose replacement and limits of the result.

## @evidence contracts/development/design.md#principled-representation

Overshoot and error use degrees, while strain uses the caller's objective units or the explicitly weighted reference-pose departure.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Seeded fits and solved plants carry the same producer-owned score rather than redeclaring its three fields.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A returned least-overshoot candidate can remain illegal; the score does not manufacture a successful feasibility verdict.
