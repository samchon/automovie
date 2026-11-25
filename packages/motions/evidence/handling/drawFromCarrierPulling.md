# src/handling/drawFromCarrierPulling.ts#drawFromCarrierPulling
## @evidence contracts/development/common.md#meaningful-documentation

States when there is a pull (the draw asks for one) and what the other hand must already hold, and what it returns.

## @evidence contracts/development/implementation.md#principled-implementation

The pulling hand is the other hand, which the entry state already records as holding the worn carrier; its wrist and elbow hint are read from the entry pose (`poseBones`, `AutoMovieMotionHumanBend.hang`), and the trunk's twist is the authored `pull.turn` signed by the drawing side.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Split out of `drawFromCarrier` as the one place that reads the pull: no pull, two admission refusals, then one entry read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A carrier the other hand does not hold, or one the performer does not wear, is refused with the alternative or the fix; nothing is assumed in their place.

## @evidence contracts/development/implementation.md#efficient-algorithms

One forward-kinematics read of one bone at the entry; constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read of the entry; its caller keeps the result for the plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/handling/drawFromCarrierPulling.ts#drawFromCarrierPulling.IPulled

## @evidence contracts/development/common.md#meaningful-documentation

Each member names its unit and frame.

## @evidence contracts/development/design.md#principled-representation

The pulling hand's side, part and limb, its world wrist and elbow hint at the entry, the hanger bone and the trunk's twist in degrees.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the draw plan, the pivot and the carried variant; nothing else.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No optional member: a draw without a pull has no record (`null`).
