# src/motion/human/posture/IAutoMovieMotionHumanArmGeometry.ts#IAutoMovieMotionHumanArmGeometry.ISetup

## @evidence contracts/development/common.md#meaningful-documentation

constraint: Each joint's range; the elbow's and the wrist's may be absent.

## @evidence contracts/development/design.md#principled-representation

constraint: Each joint's range; the elbow's and the wrist's may be absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanArmDifferential.ts (HumanArmDifferential.step, setup); posture/HumanArmFrame.ts (HumanArmFrame.of, setup); posture/HumanArmFrame.ts (HumanArmFrame.built, setup); posture/HumanArmGeometry.ts (HumanArmGeometry.prepare, return); posture/HumanArmGeometry.ts (HumanArmGeometry.rotation, setup); posture/HumanArmGeometry.ts (HumanArmGeometry.clamped, setup).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanBody, AutoMovieHumanoidBone, IAutoMovieJointConstraint, IAutoMovieJointRotationFrame identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/posture/IAutoMovieMotionHumanArmGeometry.ts#IAutoMovieMotionHumanArmGeometry.IFrame

## @evidence contracts/development/common.md#meaningful-documentation

tip: Mapped MiddleDistal bone origin in hand-local metres; zero when that distal bone is absent. This is a bone origin, not a measured physical fingertip. corners: Each surface probe's index among its part's own probes, for the audit's reference depth of it. related: Whether two own-body audit parts are one part or share a joint (`AutoMovieMotionHumanAuditTangleModel.IModel.related`); external frame parts lie beyond this table and have no exclusion. resting: The external parts the hand rests on in this frame (the base's `rests`, by frame part index): their pairs with the hand are its contact, not a collision.

## @evidence contracts/development/design.md#principled-representation

tip: Mapped MiddleDistal bone origin in hand-local metres; zero when that distal bone is absent. This is a bone origin, not a measured physical fingertip. corners: Each surface probe's index among its part's own probes, for the audit's reference depth of it. related: Whether two own-body audit parts are one part or share a joint (`AutoMovieMotionHumanAuditTangleModel.IModel.related`); external frame parts lie beyond this table and have no exclusion. resting: The external parts the hand rests on in this frame (the base's `rests`, by frame part index): their pairs with the hand are its contact, not a collision.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanArmDifferential.ts (HumanArmDifferential.step, frame); posture/HumanArmFrame.ts (HumanArmFrame.of, return); posture/HumanArmFrame.ts (HumanArmFrame.built, return); posture/HumanArmFrame.ts (HumanArmFrame.built.near, c); posture/HumanArmGeometry.ts (HumanArmGeometry.placed, at); posture/HumanArmJacobian.ts (HumanArmJacobian.columns, at).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieQuaternion, IAutoMovieVector3, AutoMovieHumanoidBone, IAutoMovieMotionHumanColliders.IPlaced, IAutoMovieMotionHumanArmGeometry.IShape identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/posture/IAutoMovieMotionHumanArmGeometry.ts#IAutoMovieMotionHumanArmGeometry.IShape

## @evidence contracts/development/common.md#meaningful-documentation

radius: Its bounding sphere's radius, metres.

## @evidence contracts/development/design.md#principled-representation

radius: Its bounding sphere's radius, metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanArmShapes.ts (HumanArmShapes.colliders, return); posture/HumanArmShapes.ts (HumanArmShapes.bounded, return); posture/HumanArmShapes.ts (HumanArmShapes.near, shape); posture/HumanArmShapes.ts (HumanArmShapes.relative, now); posture/HumanArmShapes.ts (HumanArmShapes.relative, next); posture/HumanArmTrajectoryOverlap.ts (HumanArmTrajectoryOverlap.crossing.near, shape).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieHumanoidBone, IAutoMovieMotionHumanColliders.IPlaced, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/posture/IAutoMovieMotionHumanArmGeometry.ts#IAutoMovieMotionHumanArmGeometry.IPlaced

## @evidence contracts/development/common.md#meaningful-documentation

probes: Each probe's world point and radius: eight axis spheres (two on the upper arm, four on the forearm to the wrist, two on the hand), then optional collider probes with radius 0. With surface=false there are exactly eight probes. shoulder: The shoulder's world point. elbow: The elbow's world point.

## @evidence contracts/development/design.md#principled-representation

probes: Each probe's world point and radius: eight axis spheres (two on the upper arm, four on the forearm to the wrist, two on the hand), then optional collider probes with radius 0. With surface=false there are exactly eight probes. shoulder: The shoulder's world point. elbow: The elbow's world point.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: compose/AutoMovieMotionHumanArmFollow.ts (AutoMovieMotionHumanArmFollow.follower.next.placed, return); compose/AutoMovieMotionHumanArmFollow.ts (AutoMovieMotionHumanArmFollow.follower.next.contact, p); posture/HumanArmGeometry.ts (HumanArmGeometry.placed, return); posture/HumanArmJacobian.ts (HumanArmJacobian.columns, placed); posture/HumanArmRefine.ts (certified.inside, return); posture/HumanArmRefine.ts (certified.ends, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3, IAutoMovieQuaternion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/posture/IAutoMovieMotionHumanArmGeometry.ts#IAutoMovieMotionHumanArmGeometry.Segment

## @evidence contracts/development/common.md#meaningful-documentation

Names the two carriers of an obstacle shape and the `subject:part` form of the external one.

## @evidence contracts/development/design.md#principled-representation

A rig bone or a template literal with a colon, so an external segment is always written as subject and part.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Names the segment an obstacle belongs to in the arm geometry's records, for rig bones and `IAutoMovieMotionHumanColliders.IExternal` segments alike.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The template admits any colon-joined string; whether the subject and part exist remains for the runtime that resolves them.
