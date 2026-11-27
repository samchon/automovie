import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanStrikingReach,
  IAutoMovieVector3,
} from "@automovie/interface";

import { KneeForm } from "./KneeForm";

/*
 * The knee strike's reach: the thigh carries the knee on a circle about the
 * hip, whose front lies one thigh plus one patella depth from the hip along the
 * thigh. The thigh rises to the elevation whose circle meets the target's
 * height, bounded by the hip's flexion range less the back lean that tips the
 * pelvis; the pelvis then travels horizontally along the line toward the target
 * until the knee's front is on it, forward (the hip thrust of the clinch knee)
 * or back (the hips drawn back to make room when the opponent is chest to
 * chest). The shank folds back under the knee by KneeForm.FLEXION.
 */
export namespace KneeReach {
  /*
   * A solved knee: where its joint, ankle and pelvis go at the contact.
   */
  export interface ISolution {
    /*
     * The knee joint, world metres.
     */
    knee: IAutoMovieVector3;

    /*
     * The ankle folded under it, world metres.
     */
    ankle: IAutoMovieVector3;

    /*
     * The pelvis's horizontal travel, world metres.
     */
    thrust: IAutoMovieVector3;

    /*
     * The horizontal unit direction the thigh points in.
     */
    heading: IAutoMovieVector3;

    /*
     * Whether the knee's front reaches the target, falls short, or is jammed.
     */
    status: IAutoMovieMotionHumanStrikingReach.ISolution["status"];
  }

  /*
   * Solve the knee for a hip and a target.
   * Parameter hip: The kicking hip before the pelvis travels, world metres.
   * Parameter target: The target point, world metres.
   * Parameter thigh: The thigh length, metres.
   * Parameter patella: The knee's front from its joint, metres.
   * Parameter shank: The shank length, metres.
   * Parameter travel: The pelvis's longest travel, metres.
   * Parameter fallback: A horizontal unit direction for a target straight above or
   * below the hip.
   * Returns: The solution.
   */
  export function solve(
    hip: IAutoMovieVector3,
    target: IAutoMovieVector3,
    thigh: number,
    patella: number,
    shank: number,
    travel: number,
    fallback: IAutoMovieVector3,
  ): ISolution {
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const radius: number = thigh + patella;

    // The elevation whose circle meets the target's height, bounded by the
    // hip's flexion (the thigh at the horizontal is 90 degrees of flexion,
    // and the back lean tips the pelvis by its own angle).
    const highest: number = KneeForm.HIP_FLEXION - 90 + KneeForm.LEAN;
    const wanted: number =
      (Math.asin(Math.max(-1, Math.min(1, (target.y - hip.y) / radius))) *
        180) /
      Math.PI;
    const elevation: number =
      (Math.max(-KneeForm.LOWEST, Math.min(highest, wanted)) * Math.PI) / 180;

    // The horizontal travel that puts the knee's front on the target.
    const flat: IAutoMovieVector3 = {
      x: target.x - hip.x,
      y: 0,
      z: target.z - hip.z,
    };
    const distance: number = Vector3.length(flat);
    const heading: IAutoMovieVector3 =
      distance > 1e-6 ? Vector3.scale(flat, 1 / distance) : fallback;
    const want: number = distance - radius * Math.cos(elevation);
    const moved: number = Math.max(-travel, Math.min(travel, want));
    const status: IAutoMovieMotionHumanStrikingReach.ISolution["status"] =
      wanted > highest + 1e-9 ||
      wanted < -KneeForm.LOWEST - 1e-9 ||
      want > travel + 1e-9
        ? "short"
        : want < -travel - 1e-9
          ? "jammed"
          : "reached";
    const thrust: IAutoMovieVector3 = Vector3.scale(heading, moved);

    // The thigh along its elevation, the shank folded back and down in the
    // same vertical plane by the knee's flexion.
    const along: IAutoMovieVector3 = Vector3.add(
      Vector3.scale(heading, Math.cos(elevation)),
      Vector3.scale(up, Math.sin(elevation)),
    );
    const below: IAutoMovieVector3 = Vector3.subtract(
      Vector3.scale(heading, Math.sin(elevation)),
      Vector3.scale(up, Math.cos(elevation)),
    );
    const flexion: number = (KneeForm.FLEXION * Math.PI) / 180;
    const knee: IAutoMovieVector3 = Vector3.add(
      Vector3.add(hip, thrust),
      Vector3.scale(along, thigh),
    );
    const fold: IAutoMovieVector3 = Vector3.add(
      Vector3.scale(along, Math.cos(flexion)),
      Vector3.scale(below, Math.sin(flexion)),
    );
    return {
      knee,
      ankle: Vector3.add(knee, Vector3.scale(fold, shank)),
      thrust,
      heading,
      status,
    };
  }

  /*
   * A unit direction swung toward another along the great arc between them.
   * Parameter from: The direction at share 0, unit.
   * Parameter to: The direction at share 1, unit.
   * Parameter share: How far along the arc, 0 to 1.
   * Returns: The unit direction; `to` when the two are parallel or opposed,
   * where the arc's plane is not defined.
   */
  export function swing(
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
    share: number,
  ): IAutoMovieVector3 {
    const axis: IAutoMovieVector3 = Vector3.cross(from, to);
    const sine: number = Vector3.length(axis);
    if (sine < 1e-9) return to;
    const degrees: number =
      (Math.atan2(sine, Vector3.dot(from, to)) * 180) / Math.PI;
    return Quaternion.rotateVector(
      Quaternion.fromAxisAngle(Vector3.scale(axis, 1 / sine), degrees * share),
      from,
    );
  }

  /*
   * The driven foot's axes under a shank: the toes pointed down by
   * KneeForm.PLANTAR from the foot's neutral, which is square to the
   * shank on the side the knee faces.
   * Parameter shank: The unit direction from the knee to the ankle.
   * Parameter heading: The horizontal unit direction the knee faces.
   * Returns: The toes' direction and the instep's, both unit, for
   * `StrikingBody.foot`.
   */
  export function foot(
    shank: IAutoMovieVector3,
    heading: IAutoMovieVector3,
  ): IFootResult {
    const front: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(
        heading,
        Vector3.scale(shank, Vector3.dot(heading, shank)),
      ),
    );
    const angle: number = (KneeForm.PLANTAR * Math.PI) / 180;
    return {
      toes: Vector3.add(
        Vector3.scale(front, Math.cos(angle)),
        Vector3.scale(shank, Math.sin(angle)),
      ),
      instep: Vector3.subtract(
        Vector3.scale(front, Math.sin(angle)),
        Vector3.scale(shank, Math.cos(angle)),
      ),
    };
  }
}

/*
 * The record of `IFootResult`'s site.
 */
type IFootResult = { toes: IAutoMovieVector3; instep: IAutoMovieVector3 };
