# src/human/skeleton/IAutoMovieHumanJointTransition.ts#IAutoMovieHumanJointTransition

## @evidence contracts/development/common.md#meaningful-documentation

Describes angular transition half-width fields and sample-selection inputs in metres and radians; nested declarations retain their units, frames, optional states and callback contracts.

## @evidence contracts/development/design.md#principled-representation

Angular transition half-width fields and sample-selection inputs in metres and radians. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these dependency-free exchange types for AutoMovieHumanJointTransition; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups the existing JointTransition contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.

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
