# src/harness/IAutoMovieActionTarget.ts#IAutoMovieActionTarget

## @evidence contracts/development/design.md#principled-representation

A discriminated union on `kind`, so `performShot` validates each representation by narrowing and `positionalTargetFault` explains a failed one in terms of the kind the author chose.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Six representations cover a staged node, a live bone, a literal point, a group centroid and two relative goals, each in its own record, instead of one record with optional fields whose combinations would need rules.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Relative targets are not converted to a guessed world point; a locomote toward one steps in place and every other verb refuses it with a located violation, and the gap is stated here.

## @evidence contracts/development/common.md#meaningful-documentation

States which kind to prefer and why, which kinds resolve to a point and through which function, what a bone target needs, and exactly how the unresolved relative kinds behave per verb.
