# src/animals/EquineExpressionPose.ts#EquineExpressionPose.IChannels

## @evidence contracts/development/common.md#meaningful-documentation

Each member's unit and frame.

## @evidence contracts/development/design.md#principled-representation

Optional per channel: absent leaves that channel as the base sample has it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The seven channels the layer drives.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/EquineExpressionPose.ts#EquineExpressionPose.IHead

## @evidence contracts/development/common.md#meaningful-documentation

The turns are model-space deltas; the share is in [0, 1].

## @evidence contracts/development/design.md#principled-representation

The full solve and the shown fraction of it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A member of `IChannels`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/EquineExpressionPose.ts#EquineExpressionPose.IEar

## @evidence contracts/development/common.md#meaningful-documentation

The direction is in the rest model's space; the share is in [0, 1].

## @evidence contracts/development/design.md#principled-representation

A direction and a share.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A member of `IChannels`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/EquineExpressionPose.ts#EquineExpressionPose.ITail

## @evidence contracts/development/common.md#meaningful-documentation

Degrees about the trunk's lateral and long axes.

## @evidence contracts/development/design.md#principled-representation

Two angles.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A member of `IChannels`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/EquineExpressionPose.ts#EquineExpressionPose.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

States what each member is.

## @evidence contracts/development/design.md#principled-representation

Rest rotations of the trunk and head and one carrier per non-bone part and contact.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What `pose` reads beyond the sample.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/EquineExpressionPose.ts#EquineExpressionPose.pose

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the output and the refusal owner.

## @evidence contracts/development/implementation.md#principled-implementation

Read the sample's FK frames, pre-multiply the neck's and head's rotations by the shown share of their turns (slerp from identity) with the poll carried about the neck's root, turn the tail about its dock in the trunk's frame, move every part by its carrier's rigid delta, then turn each ear about its root toward its carriage in the current head's frame and the jaw about its hinge and the upper lip about its root on the head's lateral axis; a roll turns the neck about its own bar and carries the head.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Bone frames, carrier deltas, per-part local turns, one emission.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Limbs, trunk and contacts keep the base sample's frames exactly; nothing is clamped.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(B) deltas over the caller's one rig read, and O(P+A) part and contact moves, only for those whose carrier changed, as the carrier emitter does.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the shared rig reader, `QuadrupedRigDelta` and the model's own repose.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned model owns its parts; nothing is retained.
