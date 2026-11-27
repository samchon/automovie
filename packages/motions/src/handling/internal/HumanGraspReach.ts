import { Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGrasp,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../../actions/internal/stand";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import type { HumanGrasp } from "./HumanGrasp";

/**
 * Where another person's arm is predicted from and how a grip turns about its
 * handle: the standing posture a person settles into, and a target turned about
 * its wrapped axis. `HumanGrasp` passes these through by name.
 */
export namespace HumanGraspReach {
  /**
   * The standing posture a person settles into from where they stand: the stand
   * law's posture centred over the person's displayed feet, facing the way the
   * pelvis faces. A law predicting another person's arm (a handshake's partner,
   * a handover's receiver) reads it, so the prediction starts from the same
   * root the partner's own stand law will hold.
   *
   * @param body The person's body.
   * @param bones The person's displayed world bones.
   * @returns The posture.
   */
  export function standing(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<
      AutoMovieHumanoidBone,
      Pick<IAutoMovieResolvedBone, StandingBonesEntry>
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
  export function around(
    target: HumanGrasp.IFrame,
    turn: number,
  ): HumanGrasp.IFrame;
  /** Preserve all supplied target fields while turning only its approach. */
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

/** The alternatives of `StandingBonesEntry`'s site. */
type StandingBonesEntry = "worldPosition" | "worldRotation";
