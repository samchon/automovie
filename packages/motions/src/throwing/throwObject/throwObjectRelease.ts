import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanThrowObjectForm,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanTrunk } from "../../compose/AutoMovieMotionHumanTrunk";
import { HumanTrunk } from "../../everyday/HumanTrunk";
import { HumanFrame } from "../../posture/HumanFrame";
import { HumanHand } from "../../posture/HumanHand";
import { poseBones } from "../../posture/poseBones";
import { resolveHumanPosture } from "../../posture/resolveHumanPosture";
import { throwObjectForm } from "./throwObjectForm";

/**
 * The throw's trunk and its release place, read by `throwObject`.
 *
 * The trunk is a twist shared by the chest and the spine with a forward
 * inclination added through the spine and the chest alone (`HumanTrunk.incline`
 * with no pelvis share), so a throw performed over a carrier never claims the
 * pelvis. At release the trunk is square to the line and inclined by the
 * style's `throwObjectForm.TILT`, so the release is read from the throwing
 * shoulder of that pose, not of the standing one: where a study gives the
 * elbow's flexion at release (`throwObjectForm.ELBOW`) the wrist stands the
 * shoulder-to-wrist distance that flexion leaves (the law of cosines on the
 * upper arm and the forearm) along the place's direction and the grip the held
 * hand's grip offset beyond it; otherwise the place is the style's
 * `throwObjectForm.PLACES` release from that shoulder.
 */
export namespace throwObjectRelease {
  /**
   * The trunk's joints for a twist and a forward inclination.
   *
   * @param joints The posture's joints.
   * @param twist The trunk's twist, degrees; positive toward the performer's
   *   left.
   * @param tilt The forward inclination, degrees.
   * @returns The joints with the chest and the spine written.
   */
  export function trunk(
    joints: IAutoMovieMotionHumanPosture["joints"],
    twist: number,
    tilt: number,
  ): IAutoMovieMotionHumanPosture["joints"] {
    return HumanTrunk.incline(
      {
        ...joints,
        chest: [0, 0, AutoMovieMotionHumanTrunk.CHEST * twist],
        spine: [0, 0, (1 - AutoMovieMotionHumanTrunk.CHEST) * twist],
      },
      tilt,
      0,
    ).joints;
  }

  /** What the release place is read from. */
  export interface IProps {
    /** The thrower. */
    body: IAutoMovieMotionHumanBody;

    /** The throwing hand. */
    side: AutoMovieHumanSide;

    /** The style. */
    style: IAutoMovieMotionHumanThrowObjectForm.Style;

    /** The standing posture the places are read on. */
    standing: IAutoMovieMotionHumanPosture;

    /** The hand's world rotation at release. */
    held: IAutoMovieQuaternion;
  }

  /**
   * The grip's place at release.
   *
   * @param props The thrower, the hand, the style, the standing posture and the
   *   held rotation.
   * @returns World metres.
   */
  export function point(props: IProps): IAutoMovieVector3 {
    const { body, side, style, standing } = props;
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const frame: IAutoMovieMotionHumanFrame = {
      origin: standing.root,
      yaw: standing.yaw,
    };
    const requested: ReadonlySet<AutoMovieHumanoidBone> =
      new Set<AutoMovieHumanoidBone>([`${side}UpperArm`]);
    const shoulder: IAutoMovieVector3 = HumanFrame.local(
      frame,
      poseBones(
        body,
        resolveHumanPosture.seeded(
          body,
          {
            ...standing,
            joints: trunk(standing.joints, 0, throwObjectForm.TILT[style]),
          },
          undefined,
          {},
          undefined,
          requested,
        ).pose,
        undefined,
        requested,
      ).get(`${side}UpperArm`)!.worldPosition,
    );
    const outward: number = side === "left" ? 1 : -1;
    const share: IAutoMovieVector3 = throwObjectForm.PLACES[style].release;
    const flexion: number | undefined = throwObjectForm.ELBOW[style];
    if (flexion === undefined) {
      const arm: number = m.upperArm + m.forearm;
      return HumanFrame.point(frame, {
        x: shoulder.x + outward * share.x * arm,
        y: shoulder.y + share.y * arm,
        z: shoulder.z + share.z * arm,
      });
    }
    const along: IAutoMovieVector3 = Vector3.normalize({
      x: outward * share.x,
      y: share.y,
      z: share.z,
    });
    const bent: number = (flexion * Math.PI) / 180;
    const reach: number = Math.sqrt(
      m.upperArm ** 2 +
        m.forearm ** 2 +
        2 * m.upperArm * m.forearm * Math.cos(bent),
    );
    const wrist: IAutoMovieVector3 = HumanFrame.point(
      frame,
      Vector3.add(shoulder, Vector3.scale(along, reach)),
    );
    return Vector3.subtract(
      Vector3.scale(wrist, 2),
      HumanHand.place(body, side, "grip", wrist, props.held, "relaxed").point,
    );
  }
}
