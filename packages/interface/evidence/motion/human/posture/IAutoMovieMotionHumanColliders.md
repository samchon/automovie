# src/motion/human/posture/IAutoMovieMotionHumanColliders.ts#IAutoMovieMotionHumanColliders.IPlaced

## @evidence contracts/development/common.md#meaningful-documentation

pose: The segment's posed frame, world metres: the bone's world transform applied to the segment's neutral offset from the bone's rest joint.

## @evidence contracts/development/design.md#principled-representation

pose: The segment's posed frame, world metres: the bone's world transform applied to the segment's neutral offset from the bone's rest joint.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: actions/walkLegBinding.ts (walkLegBinding.prepareRelative, a); actions/walkLegBinding.ts (walkLegBinding.prepareRelative, b); actions/walkLegBinding.ts (walkLegBinding.prepareInside, shape); actions/walkLegClearance.ts (walkLegClearance.excess.segments).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieHumanoidBone, IAutoMovieRigidTransform, IAutoMoviePhysicalShape identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/posture/IAutoMovieMotionHumanColliders.ts#IAutoMovieMotionHumanColliders.IFramed

## @evidence contracts/development/common.md#meaningful-documentation

States each member's frame and ownership.

## @evidence contracts/development/design.md#principled-representation

A placed frame and its borrowed shapes, the part every obstacle reading needs.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Extended by the body's placed segments (`IPlaced`) and by another subject's (`IExternal`).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieRigidTransform and IAutoMoviePhysicalShape identities.

# src/motion/human/posture/IAutoMovieMotionHumanColliders.ts#IAutoMovieMotionHumanColliders.IExternal

## @evidence contracts/development/common.md#meaningful-documentation

States what the segment is and how it is named.

## @evidence contracts/development/design.md#principled-representation

The frame and shapes of any obstacle, with the scene subject and its own part name in place of a rig bone.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by a limb goal's external clearance (`IAutoMovieHumanLimbGoal.clearExternal`).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A prop is never named as a rig bone.

# src/motion/human/posture/IAutoMovieMotionHumanColliders.ts#IAutoMovieMotionHumanColliders.IDistance

## @evidence contracts/development/common.md#meaningful-documentation

distance: Metres, negative inside.

## @evidence contracts/development/design.md#principled-representation

distance: Metres, negative inside.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanColliders.ts (HumanColliders.distance, return); posture/HumanColliders.ts (HumanColliders.distanceToSegment, return); executable/cases/StrikingLimb.ts (StrikingLimb.gap); posture/HumanColliders.ts (HumanColliders.nearest); posture/HumanColliders.ts (HumanColliders.distanceToSegment); posture/HumanColliders.ts (HumanColliders.cast).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieHumanoidBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/posture/IAutoMovieMotionHumanColliders.ts#IAutoMovieMotionHumanColliders.IHit

## @evidence contracts/development/common.md#meaningful-documentation

point: The point on the collider surface, world metres.

## @evidence contracts/development/design.md#principled-representation

point: The point on the collider surface, world metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanColliders.ts (HumanColliders.cast, return); everyday/HumanTrunk.ts (HumanTrunk.surface).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3, AutoMovieHumanoidBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/posture/IAutoMovieMotionHumanColliders.ts#IAutoMovieMotionHumanColliders.IBall

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its frame and unit.

## @evidence contracts/development/design.md#principled-representation

A centre and a radius, the bound a query tests before the shape itself.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/motion/human/posture/IAutoMovieMotionHumanColliders.ts#IAutoMovieMotionHumanColliders.INearestResult

## @evidence contracts/development/common.md#meaningful-documentation

point: Nearest collider surface point in world metres. normal: Outward surface normal at that point in world coordinates.

## @evidence contracts/development/design.md#principled-representation

point: Nearest collider surface point in world metres. normal: Outward surface normal at that point in world coordinates.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanColliders.ts (HumanColliders.nearest, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanColliders.IDistance, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
