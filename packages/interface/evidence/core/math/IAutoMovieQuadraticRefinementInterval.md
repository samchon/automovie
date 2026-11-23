# src/core/math/IAutoMovieQuadraticRefinementInterval.ts#IAutoMovieQuadraticRefinementInterval

## @evidence contracts/development/design.md#principled-representation

Identical coefficient rows constrain one affine value, so their feasible set is the intersection of their intervals, the strongest lower and upper endpoints; grouping only exact matches keeps that identity exact, and keeping the owners lets a group multiplier be restored to an original row.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The coefficients, the intersected interval, the two endpoint owners and the member list, which is what the active-set step needs to form one equation per group and map its multiplier back.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Groups by exact equality only, with no tolerance or scaling, and weaker members are kept for admission rather than deleted.

## @evidence contracts/development/common.md#meaningful-documentation

States the grouping rule, what is excluded, the endpoint and owner choice with its tie rule, that members stay in admission, and the empty-intersection refusal.
