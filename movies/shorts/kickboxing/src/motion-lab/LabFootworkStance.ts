import type { MotionAction } from "../motion/core/MotionAction";
import type { LabActor } from "./LabActor";

/**
 * Immutable source stance for a separately replayable independent foot route.
 * @evidence contracts/common.md#implementation-and-ownership The host copies actual fitted pose, source root and both actual sole witnesses before adopting a later technique origin; replay never rereads those inputs from the changed actor baseline.
 * @evidence contracts/common.md#authoring-interface Origin and low-patch anchors are world metres, while route targets use that source root's actor frame. Pose and witness data remain caller-owned snapshots.
 */
export interface LabFootworkStance {
  /** Actual fitted source pose. */ pose: LabActor["basePose"];
  /** Actual source world root. */ origin: MotionAction.Vec3;
  /** Same measured source sole for each anatomical side. */ patches: Record<
    MotionAction.Side,
    MotionAction.SupportPatch
  >;
}
