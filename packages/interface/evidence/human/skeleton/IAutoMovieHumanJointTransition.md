# src/human/skeleton/IAutoMovieHumanJointTransition.ts#IAutoMovieHumanJointTransition.ISectors

## @evidence contracts/development/common.md#meaningful-documentation

A half width by the angle about a plane's normal.

## @evidence contracts/development/design.md#principled-representation `u`: First axis square to the normal, where the angle is zero. `v`: Second axis square to the normal, a quarter turn on. `terms`: Mean, then cosine and sine of the angle and of twice it, metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanJointTransition.measure. Read by AutoMovieHumanJointTransition.half.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `u`, `v`, `terms`, `least`, `most`; callers supply the complete record.

# src/human/skeleton/IAutoMovieHumanJointTransition.ts#IAutoMovieHumanJointTransition.IMeasure

## @evidence contracts/development/common.md#meaningful-documentation

What one transition is measured from.

## @evidence contracts/development/design.md#principled-representation `points`: Skin samples, metres, three numbers each. `held`: Whether a sample belongs to the joint's two bones and side. `at`: The plane's point, metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanJointTransition.measure.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `points`, `held`, `at`, `normal`, `turn`, `least`, `most`; callers supply the complete record.
