# src/posture/HumanArmTrajectoryAllowances.ts#HumanArmTrajectoryAllowances

## @evidence contracts/development/common.md#meaningful-documentation

States the readers, what they read and who reads them.

## @evidence contracts/development/implementation.md#principled-implementation

A declared rest is a resting contact, no deeper than where the segments meet; any other pair may lie the audit's skin deeper; own-body corners keep the tangle audit's reference depth; a shared grasp keeps its depth on the hold by the share of the reach still made.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Every allowance table is filled once from the scope the context builder hands over; each reader only indexes its table.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every pair is read with its own reference depth and rest; nothing is relaxed.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each pair is computed once per context, in flat arrays indexed by waypoint, arm and pair. An axis sphere's distance is queried only against the shapes the resting arm can reach (`HumanArmShapes.reachable`), since every other shape is at least the pairs' reach beyond the sphere and its depth is zero. A grasp's hold depth is read only where a grasp closes or parts.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the waypoints' placed arms and frames, the audit model's reference depths and the shapes' distances.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The readers and their tables live with the context that holds them; nothing is filled after construction.

# src/posture/HumanArmTrajectoryAllowances.ts#HumanArmTrajectoryAllowances.IScope

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what the context built.

## @evidence contracts/development/design.md#principled-representation

The context builder's own values, named, so the readers read them explicitly.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Six members, each read by a reader.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The scope holds the builder's values as they are; nothing is copied or derived.

# src/posture/HumanArmTrajectoryAllowances.ts#HumanArmTrajectoryAllowances.Reader

## @evidence contracts/development/common.md#meaningful-documentation

Names the context members the readers are.

## @evidence contracts/development/design.md#principled-representation

The keys of the context's own reader members.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Six names.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each name is a member of the context type.

# src/posture/HumanArmTrajectoryAllowances.ts#HumanArmTrajectoryAllowances.IReaders

## @evidence contracts/development/common.md#meaningful-documentation

States that the readers are the context's own members.

## @evidence contracts/development/design.md#principled-representation

A pick of the context type, so the readers' signatures are the context's.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The six readers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No signature is restated.
