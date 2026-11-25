# src/animals/EquineHeadReach.ts#EquineHeadReach.IBars

## @evidence contracts/development/common.md#meaningful-documentation

Metres and unit quaternions in model space; `body` is the trunk's rotation away from its rest.

## @evidence contracts/development/design.md#principled-representation

The bars' origins and rotations as the rig emits them, with local +Y along each bar.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What the solve reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/EquineHeadReach.ts#EquineHeadReach.ITurn

## @evidence contracts/development/common.md#meaningful-documentation

States the frame and how the deltas apply.

## @evidence contracts/development/design.md#principled-representation

Two unit quaternions; the poll moves with the neck's delta about the root.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by both solves.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/EquineHeadReach.ts#EquineHeadReach.face

## @evidence contracts/development/common.md#meaningful-documentation

States what is turned and what is kept.

## @evidence contracts/development/implementation.md#principled-implementation

The bearing from the neck's root to the target in the trunk's frame replaces the neck's current bearing; the head rides the neck unchanged.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One bearing, one yaw.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the trunk-frame turn with `reach`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/EquineHeadReach.ts#EquineHeadReach.reach

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the clearance and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

In the trunk's frame, the target's bearing yaws both links and the law of cosines on the neck's length a, the head's link b plus the gap and the root-to-target distance D gives the neck's elevation with the poll bent upward, or downward when `under`; the head then points from the moved poll at the target.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit the band, solve the triangle, decompose each bar's change into yaw and pitch.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A target outside [|a-b|, a+b] is refused with the band, never clamped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the trunk-frame turn with `face`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/EquineHeadReach.ts#EquineHeadReach.pitched

## @evidence contracts/development/common.md#meaningful-documentation

States each angle's axis, pivot and sign.

## @evidence contracts/development/implementation.md#principled-implementation

Both turns are about the trunk's lateral axis, so the head never rolls or yaws; the head's delta carries the neck's turn plus its own.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two axis-angle turns.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the turn convention of `face` and `reach`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
