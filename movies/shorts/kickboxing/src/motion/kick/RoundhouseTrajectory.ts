import { ActionClock } from "../core/ActionClock";
import type { MotionAction } from "../core/MotionAction";

/**
 * Actor-local shin path with separate chamber, delivery, withdrawal and landing.
 *
 * @evidence contracts/common.md#implementation-and-ownership A bounded quadratic arc connects independently measured initial and requested contact points through a leg-scaled lateral chamber. Its coefficients are authored path choices informed by the retained Chan chamber/turn/replant sequence, not measured joint trajectories. Constant-size tuple arithmetic retains no state and proves no FK feasibility or collision clearance.
 * @evidence contracts/common.md#authoring-interface Inputs and outputs are actor-local metres in +X forward, +Y up, +Z left. The owner supplies real initial shin/hip points and limb lengths. Delivery remains an intent until the actual host constrains it; withdrawal starts at a supplied constrained point.
 */
export namespace RoundhouseTrajectory {
  /**
   * Compute a compact shin destination from actual hip height and leg scale.
   *
   * @evidence contracts/common.md#implementation-and-ownership Fixed leg-scaled offsets provide an authored lifted chamber from supplied landmarks, with side-aware lateral direction and no retained state. They express coaching phase relations rather than measured angles.
   * @evidence contracts/common.md#authoring-interface Requires a nonzero horizontal direction and positive leg metres, validated by RoundhouseAction; returns actor-local shin metres and does not solve its joints.
   */
  export function chamber(hip: MotionAction.Vec3, initial: MotionAction.Vec3, direction: MotionAction.Vec3, side: MotionAction.Side, legMetres: number): MotionAction.Vec3 {
    const horizontal: number = Math.hypot(direction[0], direction[2]);
    const forward: MotionAction.Vec3 = [direction[0] / horizontal, 0, direction[2] / horizontal];
    const own: number = side === "left" ? 1 : -1;

    // Lift the compact lower leg before it extends; these proportions are staging choices.
    return [hip[0] + forward[0] * legMetres * .18 - forward[2] * own * legMetres * .20, Math.max(initial[1] + legMetres * .22, hip[1] - legMetres * .32), hip[2] + forward[2] * legMetres * .18 + forward[0] * own * legMetres * .20];
  }

  /**
   * Bounded, zero-endpoint-speed interpolation for an unweighted limb transfer.
   *
   * @evidence contracts/common.md#implementation-and-ownership Public Engine-backed easing interpolates three coordinates with exact endpoints, constant work and no retained inputs.
   * @evidence contracts/common.md#authoring-interface Endpoints use the same metre frame; finite progress is clamped by ActionClock.ease. The returned point is a request requiring the consumer's actual limb fit.
   */
  export function transfer(from: MotionAction.Vec3, to: MotionAction.Vec3, progress: number): MotionAction.Vec3 {
    const weight: number = ActionClock.ease(progress);
    return [from[0] + (to[0] - from[0]) * weight, from[1] + (to[1] - from[1]) * weight, from[2] + (to[2] - from[2]) * weight];
  }

  /**
   * Sweep from the compact chamber toward the explicit target with a side-aware arc.
   *
   * @evidence contracts/common.md#implementation-and-ownership A quadratic Bezier uses a leg-scaled side-aware control point, so one definition reflects for either side and reaches the exact independent target. Bending coefficients are authored staging proportions, not a captured athlete trajectory; constant work retains nothing.
   * @evidence contracts/common.md#authoring-interface Requires finite actor-local points, positive leg length and a direction with horizontal extent; RoundhouseAction validates those premises. Progress spans [0,1], with no collision claim on reaching the endpoint.
   */
  export function delivery(chamberPoint: MotionAction.Vec3, target: MotionAction.Vec3, direction: MotionAction.Vec3, side: MotionAction.Side, legMetres: number, progress: number): MotionAction.Vec3 {
    const own: number = side === "left" ? 1 : -1;
    const horizontal: number = Math.hypot(direction[0], direction[2]);
    const x: number = direction[0] / horizontal;
    const z: number = direction[2] / horizontal;
    const bend: MotionAction.Vec3 = [(chamberPoint[0] + target[0]) / 2 - z * own * legMetres * .18, (chamberPoint[1] + target[1]) / 2 + legMetres * .035, (chamberPoint[2] + target[2]) / 2 + x * own * legMetres * .18];
    const p: number = ActionClock.ease(progress);
    const q: number = 1 - p;
    return [q * q * chamberPoint[0] + 2 * q * p * bend[0] + p * p * target[0], q * q * chamberPoint[1] + 2 * q * p * bend[1] + p * p * target[1], q * q * chamberPoint[2] + 2 * q * p * bend[2] + p * p * target[2]];
  }

  /**
   * Fold away from the receiver before lowering the shin into the original stance.
   *
   * @evidence contracts/common.md#implementation-and-ownership Two zero-slope transfers meet at a compact chamber: an authored 45 percent withdrawal folds before the remainder lowers into stance. The first point may be the actual blocked configuration; no planned peak is substituted.
   * @evidence contracts/common.md#authoring-interface All points share actor-local metres, with finite closed-unit return progress; both stages are positional and velocity continuous at their join. Actual swept clearance remains the host's responsibility.
   */
  export function withdrawal(from: MotionAction.Vec3, chamberPoint: MotionAction.Vec3, landing: MotionAction.Vec3, progress: number): MotionAction.Vec3 {
    return progress < .45 ? transfer(from, chamberPoint, progress / .45) : transfer(chamberPoint, landing, (progress - .45) / .55);
  }
}
