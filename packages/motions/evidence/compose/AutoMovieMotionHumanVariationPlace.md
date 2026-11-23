# src/compose/AutoMovieMotionHumanVariationPlace.ts#AutoMovieMotionHumanVariationPlace

## @evidence contracts/development/common.md#meaningful-documentation

States what varies, where the shared terms are defined and what sets a place apart from the other slots.

## @evidence contracts/development/design.md#principled-representation

An end point ellipse lying along the arrival (Gordon et al. 1994; van Beers et al. 2004), stated in the share record a place already is.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One function and the record of an arrival it reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The offset is added to the place's own share record, so no second place type or frame enters.

# src/compose/AutoMovieMotionHumanVariationPlace.ts#AutoMovieMotionHumanVariationPlace.vary

## @evidence contracts/development/common.md#meaningful-documentation

States the unit, the frame, the spread, the bound and every input's meaning when absent.

## @evidence contracts/development/implementation.md#principled-implementation

Two terms because two things vary: where the performer means to arrive within the name, and how far the arm misses that, which alone grows with speed (Schmidt et al. 1979; Harris and Wolpert 1998). The ellipse lies along the arrival (Gordon et al. 1994; van Beers et al. 2004).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The spreads, the basis, the bounds, one factor per axis and one sum.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No component is clamped: an axis's factor is the largest for which the offset at `TRUNCATE` on every component stays inside that axis's bound.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the height, the share tables and `NUDGE` of `AutoMovieMotionHumanTarget`, and `HumanSkill.scatter`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work over three axes and eighteen names.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
