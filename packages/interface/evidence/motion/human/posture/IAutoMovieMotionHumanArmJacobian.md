# src/motion/human/posture/IAutoMovieMotionHumanArmJacobian.ts#IAutoMovieMotionHumanArmJacobian.IColumn

## @evidence contracts/development/common.md#meaningful-documentation

upper: The upper arm's twist. lower: The forearm's twist. hand: The hand's twist.

## @evidence contracts/development/design.md#principled-representation

upper: The upper arm's twist. lower: The forearm's twist. hand: The hand's twist.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanArmJacobian.ts (HumanArmJacobian.columns, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanJacobian.ITwist identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/posture/IAutoMovieMotionHumanArmJacobian.ts#IAutoMovieMotionHumanArmJacobian.IChain

## @evidence contracts/development/common.md#meaningful-documentation

An arm's chain placed at coordinates: each joint's point and each segment's world rotation.

## @evidence contracts/development/design.md#principled-representation

Closed choices "shoulder", "elbow", "wrist", "upper", "lower", "hand" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanArmJacobian.ts (HumanArmJacobian.read, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanArmGeometry.IPlaced identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/posture/IAutoMovieMotionHumanArmJacobian.ts#IAutoMovieMotionHumanArmJacobian.IReadResult

## @evidence contracts/development/common.md#meaningful-documentation

free: Zero-based indices of freely variable coordinates in c. chain: Pure synchronous forward-kinematics callback for the supplied coordinate vector; borrowed coordinates must remain stable for the call.

## @evidence contracts/development/design.md#principled-representation

free: Zero-based indices of freely variable coordinates in c. chain: Pure synchronous forward-kinematics callback for the supplied coordinate vector; borrowed coordinates must remain stable for the call.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanArmJacobian.ts (HumanArmJacobian.read, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanArmJacobian.IColumn, IAutoMovieMotionHumanArmJacobian.IChain identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
