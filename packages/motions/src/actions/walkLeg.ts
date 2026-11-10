import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { walkFoot } from "./walkFoot";

/**
 * The two-bone geometry of a stepping leg, read without solving it: where the
 * knee's bend puts the shank and the thigh for a hip and an ankle, by the law
 * of cosines on the segment lengths.
 */
export namespace walkLeg {
  /** Degrees a foot keeps inside the ankle's 50° plantar and 20° dorsal limits (DEFAULT_HUMANOID_ROM). */
  export const ANKLE: number = 2;

  /**
   * The shank's forward lean from vertical along a heading, with the knee
   * placed in the plane of the hip, the ankle and the heading.
   *
   * @param body The body.
   * @param hip The hip joint, world metres.
   * @param ankle The ankle, world metres.
   * @param heading The heading the knee bends toward, degrees.
   * @returns Degrees, positive leaning forward.
   */
  export function lean(
    body: IHumanBody,
    hip: IAutoMovieVector3,
    ankle: IAutoMovieVector3,
    heading: number,
  ): number {
    const forward: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: heading },
      { x: 0, y: 0, z: 1 },
    );
    const v: IAutoMovieVector3 = Vector3.subtract(ankle, hip);
    const d: number = Vector3.length(v);
    const a: number = body.measure.thigh;
    const b: number = body.measure.shank;
    if (d < 1e-6) return 0;
    const axis: IAutoMovieVector3 = Vector3.scale(v, 1 / d);
    const along: number = (a * a - b * b + d * d) / (2 * d);
    const across: number = Math.sqrt(Math.max(0, a * a - along * along));
    let perpendicular: IAutoMovieVector3 = Vector3.subtract(
      forward,
      Vector3.scale(axis, Vector3.dot(forward, axis)),
    );
    if (Vector3.length(perpendicular) < 1e-9) return 0;
    perpendicular = Vector3.normalize(perpendicular);
    const knee: IAutoMovieVector3 = Vector3.add(
      hip,
      Vector3.add(
        Vector3.scale(axis, along),
        Vector3.scale(perpendicular, across),
      ),
    );
    const shank: IAutoMovieVector3 = Vector3.subtract(knee, ankle);
    return (Math.atan2(Vector3.dot(shank, forward), shank.y) * 180) / Math.PI;
  }

  /**
   * The angle the bent knee puts between the thigh and the hip-to-ankle line.
   *
   * @param body The body.
   * @param reach The hip-to-ankle distance, metres.
   * @returns Radians.
   */
  export function behind(body: IHumanBody, reach: number): number {
    const a: number = body.measure.thigh;
    const d: number = Math.min(reach, a + body.measure.shank);
    return Math.acos(
      Math.min(
        1,
        Math.max(
          -1,
          (a ** 2 + d ** 2 - body.measure.shank ** 2) /
            (2 * a * Math.max(d, 1e-9)),
        ),
      ),
    );
  }

  /**
   * How far a leg's thigh trails behind vertical in the pelvis's sagittal
   * plane: the hip-to-ankle line's angle less the knee's.
   *
   * @param body The body.
   * @param hip The hip joint, world metres.
   * @param ankle The ankle, world metres.
   * @param yaw The pelvis's heading, degrees.
   * @returns Degrees, positive trailing.
   */
  export function trailing(
    body: IHumanBody,
    hip: IAutoMovieVector3,
    ankle: IAutoMovieVector3,
    yaw: number,
  ): number {
    const forward: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw },
      { x: 0, y: 0, z: 1 },
    );
    const v: IAutoMovieVector3 = Vector3.subtract(ankle, hip);
    return (
      ((Math.atan2(-(v.x * forward.x + v.z * forward.z), -v.y) -
        behind(body, Vector3.length(v))) *
        180) /
      Math.PI
    );
  }

  /**
   * A foot's rotation kept inside the ankle's range relative to its shank,
   * less `ANKLE`.
   *
   * @param body The body.
   * @param hip The hip joint, world metres.
   * @param ankle The ankle, world metres.
   * @param rotation The foot's world rotation.
   * @returns The rotation, its pitch clamped.
   */
  export function ankleRange(
    body: IHumanBody,
    hip: IAutoMovieVector3,
    ankle: IAutoMovieVector3,
    rotation: IAutoMovieQuaternion,
  ): IAutoMovieQuaternion {
    const heading: number = HumanFrame.heading(rotation);
    const shank: number = lean(body, hip, ankle, heading);
    const pitch: number = walkFoot.pitch(rotation);
    const clamped: number = Math.min(
      -shank + 20 - ANKLE,
      Math.max(-shank - 50 + ANKLE, pitch),
    );
    return clamped === pitch ? rotation : HumanFoot.rotation(heading, clamped);
  }
}
