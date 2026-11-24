# src/daily/handToFaceVessel.ts#handToFaceVessel.IVessel

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning.

## @evidence contracts/development/design.md#principled-representation

The admitted side's effector and its facing, lean and hint.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members: the law's effector and the arm's drink.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The drink is the one the side was admitted with, never solved again.

# src/daily/handToFaceVessel.ts#handToFaceVessel

## @evidence contracts/development/common.md#meaningful-documentation

States the order, the result and both refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The side is a free turn of the vessel in the hand, so it is searched by the same admission as the lean and the facing; the first admitted side in the act's own order is kept, as the facings keep head on first. The facings' span is half the turn between two evenly spaced sides, rounded up to the facings' step, so every turn of the hand round the rim is still tried.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One span, one pool, and the sides as candidates of one choice (`AutoMovieMotionHumanTouchStance.choose`).

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A side whose drink refuses its reach moves the choice to the next side, as Algorithm 1 leaves a base its arm does not reach; every other refusal propagates, and an exhausted choice refuses with the first side's facts and every side's reason. The span is derived from the sides' count, never tuned; it premises sides spaced evenly round the rim, as `HumanHeld.SIDES` are.

## @evidence contracts/development/implementation.md#efficient-algorithms

A drink the act's own side admits costs that side's search alone, five facings per lean (eight sides give a 30-degree span) in place of thirteen, and no upright pre-search of every side (up to eight sides of up to thirteen facings and two more fits each); a refused drink costs one search per side, forty screen fits per lean. Unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One pool (`AutoMovieMotionHumanDrinkingPool`) serves every side, since the body, the hand and the posture stay fixed; every candidate still fits its own goal.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The pool lives until return or throw; only the effector and the numeric drink escape.
