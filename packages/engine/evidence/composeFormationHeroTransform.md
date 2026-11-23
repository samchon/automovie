# src/composeFormationHeroTransform.ts#composeFormationHeroTransform

## @evidence contracts/development/implementation.md#principled-implementation

Quaternion composition applies the relative authored rotation `inverse(base) * source` and then the formation yaw, which is how a rigid child keeps its offset from a turning parent; the slot position uses the same formation point map as every other member, and the authored displacement is added untransformed by design, as documented.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns hero composition, shared by geometry measurement and the viewer, and delegates the formation point map to `transformFormationPoint` instead of restating it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No hero, formation or heading is special-cased; scale passes through from the source because the formation contract leaves it source-owned.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states the exact translation and rotation formulas, the frame the displacement is added in, units, scale ownership, the callers, and each parameter's role.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant time, one point map and three quaternion products, with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure per-sample composition that coordinates no work across calls; callers sample once per frame and hero.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates only the returned transform and its three components; nothing outlives the call.
