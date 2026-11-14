import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanTrunk } from "../compose/AutoMovieMotionHumanTrunk";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { throwObjectForm } from "./throwObjectForm";

/**
 * The throw's trunk and its release place, read by `throwObject`.
 *
 * The trunk is a twist shared by the chest and the spine with a forward
 * inclination added through the spine and the chest alone
 * (`HumanTrunk.incline` with no pelvis share), so a throw performed over a
 * carrier never claims the pelvis. At release the trunk is square to the line
 * and inclined by the style's `throwObjectForm.TILT`, so the release is read
 * from the throwing shoulder of that pose, not of the standing one: where a
 * study gives the elbow's flexion at release (`throwObjectForm.ELBOW`) the
 * wrist stands the shoulder-to-wrist distance that flexion leaves (the law of
 * cosines on the upper arm and the forearm) along the place's direction and
 * the grip the held hand's grip offset beyond it; otherwise the place is the
 * style's `throwObjectForm.PLACES` release from that shoulder.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the trunk's split, why the pelvis is left out, which shoulder the release is read from and how its distance follows from the elbow.
 * @evidence contracts/development/design.md#principled-representation The release is a direction from the release pose's shoulder and an elbow flexion where a study gives one, a place in arm lengths otherwise.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two functions, the trunk's joints and the release point.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every length is the body's own; the pose is the standing probe's with the trunk written as the throw writes it.
 */
export namespace throwObjectRelease {
  /**
   * The trunk's joints for a twist and a forward inclination.
   *
   * @param joints The posture's joints.
   * @param twist The trunk's twist, degrees; positive toward the performer's left.
   * @param tilt The forward inclination, degrees.
   * @returns The joints with the chest and the spine written.
   */
  export function trunk(
    joints: IHumanPosture["joints"],
    twist: number,
    tilt: number,
  ): IHumanPosture["joints"] {
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
    body: IHumanBody;

    /** The throwing hand. */
    side: HumanHand.Side;

    /** The style. */
    style: throwObjectForm.Style;

    /** The standing posture the places are read on. */
    standing: IHumanPosture;

    /** The hand's world rotation at release. */
    held: IAutoMovieQuaternion;
  }

  /**
   * The grip's place at release.
   *
   * @param props The thrower, the hand, the style, the standing posture and the held rotation.
   * @returns World metres.
   */
  export function point(props: IProps): IAutoMovieVector3 {
    const { body, side, style, standing } = props;
    const m: IHumanBody["measure"] = body.measure;
    const frame: HumanFrame.IFrame = {
      origin: standing.root,
      yaw: standing.yaw,
    };
    const shoulder: IAutoMovieVector3 = HumanFrame.local(
      frame,
      poseBones(
        body,
        resolveHumanPosture(body, {
          ...standing,
          joints: trunk(standing.joints, 0, throwObjectForm.TILT[style]),
        }),
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
