import { Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGrasp,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { HumanFrame } from "../posture/HumanFrame";
import type { HumanGrasp } from "./HumanGrasp";

/**
 * Where another person's arm is predicted from and how a grip turns about
 * its handle: the standing posture a person settles into, and a target
 * turned about its wrapped axis. `HumanGrasp` passes these through by name.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the file owns and who exposes it.
 * @evidence contracts/development/design.md#principled-representation The stand law's posture over displayed feet, and a rigid turn of a grasp target.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two operations, read through `HumanGrasp` and by `HumanGraspHand`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the stand law and the engine's quaternions; nothing is duplicated.
 */
export namespace HumanGraspReach {
  /**
   * The standing posture a person settles into from where they stand: the
   * stand law's posture centred over the person's displayed feet, facing the
   * way the pelvis faces. A law predicting another person's arm (a
   * handshake's partner, a handover's receiver) reads it, so the prediction
   * starts from the same root the partner's own stand law will hold.
   *
   * @param body The person's body.
   * @param bones The person's displayed world bones.
   * @returns The posture.
   */
  export function standing(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<
      AutoMovieHumanoidBone,
      Pick<IAutoMovieResolvedBone, "worldPosition" | "worldRotation">
    >,
  ): IAutoMovieMotionHumanPosture {
    const yaw: number = HumanFrame.heading(bones.get("hips")!.worldRotation);
    const l: IAutoMovieVector3 = bones.get("leftFoot")!.worldPosition;
    const r: IAutoMovieVector3 = bones.get("rightFoot")!.worldPosition;
    const restL: IAutoMovieVector3 = body.rest.get("leftFoot")!;
    const restR: IAutoMovieVector3 = body.rest.get("rightFoot")!;
    const centre: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw },
      { x: (restL.x + restR.x) / 2, y: 0, z: (restL.z + restR.z) / 2 },
    );
    return stand.posture(
      body,
      { x: (l.x + r.x) / 2 - centre.x, y: 0, z: (l.z + r.z) / 2 - centre.z },
      yaw,
    );
  }

  /**
   * A target turned about its wrapped axis through the axis point, as a
   * cylinder's grip may be taken from any side.
   *
   * @param target The target.
   * @param turn Degrees about the wrapped axis.
   * @returns The turned target.
   */
  export function around(
    target: IAutoMovieMotionHumanGrasp.ITarget,
    turn: number,
  ): IAutoMovieMotionHumanGrasp.ITarget;
  /** The same wrapped-axis rotation for the hand-only target view. */
  export function around(target: HumanGrasp.IFrame, turn: number): HumanGrasp.IFrame;
  /**
   * Preserve all supplied target fields while turning only its approach.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The complete and hand-only overloads keep the world target point, wrapped axis and metre width while turning the inward approach by degrees.
   * @evidence contracts/development/implementation.md#principled-implementation A rotation of the approach about the wrapped axis by the turn.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One target spread and one approach transform serve both existing target views.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every other target field is kept and no collider list, width or contact point is manufactured.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant rigid-transform work with no variable population.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Complete closure and narrow hand goals use this same numerical owner.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh target wrapper and approach vector without retained state.
   */
  export function around(
    target: HumanGrasp.IFrame,
    turn: number,
  ): HumanGrasp.IFrame {
    return {
      ...target,
      approach: Quaternion.rotateVector(
        Quaternion.fromAxisAngle(target.axis, turn),
        target.approach,
      ),
    };
  }
}
