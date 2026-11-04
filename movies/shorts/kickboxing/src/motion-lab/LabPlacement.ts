import type { MotionAction } from "../motion/core/MotionAction";

/**
 * Compare one declared body placement by value at the actor-stage boundary.
 * @evidence contracts/common.md#implementation-and-ownership Pose, root, original support identities/goals and preserved channels are compared without object-key insertion order. Root quaternion sign and omitted identity describe the same rotation; numeric pose/support values remain exact.
 * @evidence contracts/common.md#authoring-interface This predicate admits structural equality, not a physical tolerance or a second placement policy. It performs no fitting, mutation or achieved-target substitution.
 */
export namespace LabPlacement {
  /**
   * Require the same complete body authority before a narrow arm stage consumes it.
   * @evidence contracts/common.md#implementation-and-ownership Compares all body fields, including fixed trunk/legs and support metadata. Quaternion equivalence uses only 1e-10 arithmetic agreement of the same declared rigid rotation.
   * @evidence contracts/common.md#authoring-interface Reordered object properties and quaternion q/-q remain equivalent. Genuine pose, translation, anchor, load, channel-lock or heading changes return false before the actor can mutate.
   */
  export function same(left: MotionAction.BodyPlacement, right: MotionAction.BodyPlacement): boolean {
    return equal(left.pose, right.pose) && equal(left.preservedChannels, right.preservedChannels) && sameFrame(left, right);
  }

  /**
   * Check a narrow writer's declared root and support against the host's body frame.
   * @evidence contracts/common.md#implementation-and-ownership Reuses the same structural root/support and rigid-rotation semantics as complete placement comparison. It deliberately does not grant authority to the writer's unowned trunk or legs.
   * @evidence contracts/common.md#authoring-interface The body owner supplies pose and locks separately. Root displacement, heading and every original support value must agree; this never authorizes changing a body field after preparation.
   */
  export function sameFrame(left: Pick<MotionAction.BodyPlacement, "rootOffset" | "rootRotation" | "support">, right: Pick<MotionAction.BodyPlacement, "rootOffset" | "rootRotation" | "support">): boolean {
    return equal(left.rootOffset, right.rootOffset) && equal(left.support, right.support) && rotation(left.rootRotation, right.rootRotation);
  }

  /** Key order does not change a declared value; array order and numeric values do. */
  function equal(left: unknown, right: unknown): boolean {
    if (typeof left === "number" && typeof right === "number") return Number.isFinite(left) && left === right;
    if (left === right) return true;
    if (left === null || right === null || typeof left !== "object" || typeof right !== "object" || Array.isArray(left) !== Array.isArray(right)) return false;
    if (Array.isArray(left) && Array.isArray(right) && left.length !== right.length) return false;
    const keys: string[] = Object.keys(left).filter((key: string): boolean => Reflect.get(left, key) !== undefined);
    const other: string[] = Object.keys(right).filter((key: string): boolean => Reflect.get(right, key) !== undefined);
    return keys.length === other.length && keys.every((key: string): boolean => other.includes(key) && equal(Reflect.get(left, key), Reflect.get(right, key)));
  }

  /** Quaternion sign and omitted identity preserve one rigid orientation. */
  function rotation(left: MotionAction.BodyPlacement["rootRotation"], right: MotionAction.BodyPlacement["rootRotation"]): boolean {
    const a: readonly number[] = left ?? [0, 0, 0, 1];
    const b: readonly number[] = right ?? [0, 0, 0, 1];
    return a.length === 4 && b.length === 4 && a.every(Number.isFinite) && b.every(Number.isFinite) && [1, -1].some((sign: number): boolean => a.every((value: number, index: number): boolean => Math.abs(value - sign * b[index]!) <= 1e-10));
  }
}
