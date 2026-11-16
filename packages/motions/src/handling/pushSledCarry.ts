import { type IAutoMovieResolvedBone, Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import type { HumanHand } from "../posture/HumanHand";

/**
 * Carry the two grips of a floor load by one already resolved chest frame.
 * Only heading turns the load; its grip and elbow points keep their original
 * heights while the walk's chest translates and turns across the floor.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the shared frame, floor-motion restriction and carried grip/elbow semantics.
 * @evidence contracts/development/design.md#principled-representation Existing world wrist frames and elbow points are carried by a yaw-only rigid transform about the arrival chest, retaining each original world-metre height.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IHold and prepare serve pushSled's candidate samples and runtime pair; the numerical transform is owned once.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No load shape, mass or body size is embedded and the transform does not fit or certify a contact.
 */
export namespace pushSledCarry {
  /**
   * The wrist and elbow hint a hand takes at a load's handle.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States world-metre wrist/elbow placement and the hand rotation's rest-relative convention.
   * @evidence contracts/development/design.md#principled-representation A measured wrist frame and elbow hint are exactly the existing arm-goal inputs carried by the load; both are required.
   * @evidence contracts/development/design.md#minimal-and-owned-surface pushSled's grasp, candidate samples and runtime carry read both members; HumanHand owns the wrist type.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No guessed hand placement, redundant body model or optional half-hold is represented.
   */
  export interface IHold {
    /** World wrist position in metres and rest-relative hand rotation. */
    wrist: HumanHand.IWrist;

    /** World elbow hint, metres. */
    bend: IAutoMovieVector3;
  }

  /**
   * Prepare the arrival frame for all grasp samples and runtime hands.
   *
   * @param arrived The fixed chest frame at grip closure.
   * @returns A carrier of a hold onto an actual current chest frame and its yaw turn.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the arrival/current frames, the world-metre hold and returned yaw quaternion.
   * @evidence contracts/development/implementation.md#principled-implementation Retains the original rigid translation and yaw rotation about the arrival chest, followed by restoring each carried point's own height; hand rotation composes and normalizes that same yaw.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Arrival heading is fixed once; each supplied chest frame defines one turn and each hold uses the same point transform.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No posture fit, contact tolerance or grip geometry is changed or inferred by this transform.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed arrival heading is prepared once; callers resolve a current chest once for both hands or once per immutable search sample rather than once per hold.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One actual arrival frame serves the load's two hands throughout its action; each differing current chest or hold computes its own transform without a result cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned closure retains only the fixed arrival position and heading for the plan's lifetime; it retains no solver reader or sampled-time history.
   */
  export function prepare(
    arrived: IAutoMovieResolvedBone,
  ): (chest: IAutoMovieResolvedBone, hold: IHold) => { hold: IHold; turn: IAutoMovieQuaternion } {
    const facing: number = heading(arrived.worldRotation);
    return (chest: IAutoMovieResolvedBone, hold: IHold): { hold: IHold; turn: IAutoMovieQuaternion } => {
      const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
        { x: 0, y: 1, z: 0 }, heading(chest.worldRotation) - facing,
      );
      const moved: (point: IAutoMovieVector3) => IAutoMovieVector3 = (point: IAutoMovieVector3): IAutoMovieVector3 => {
        const carried: IAutoMovieVector3 = Vector3.add(chest.worldPosition,
          Quaternion.rotateVector(turn, Vector3.subtract(point, arrived.worldPosition)));
        return { x: carried.x, y: point.y, z: carried.z };
      };
      return {
        hold: {
          wrist: { point: moved(hold.wrist.point), rotation: Quaternion.normalize(
            Quaternion.multiply(turn, hold.wrist.rotation)) },
          bend: moved(hold.bend),
        },
        turn,
      };
    };
  }
}

/** Read a quaternion's world heading with the push's original +Z convention. */
function heading(rotation: IAutoMovieQuaternion): number {
  const forward: IAutoMovieVector3 = Quaternion.rotateVector(rotation, { x: 0, y: 0, z: 1 });
  return (Math.atan2(forward.x, forward.z) * 180) / Math.PI;
}
