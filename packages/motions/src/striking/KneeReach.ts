import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { KneeForm } from "./KneeForm";
import type { StrikingReach } from "./StrikingReach";

/**
 * The knee strike's reach: the thigh carries the knee on a circle about the
 * hip, whose front lies one thigh plus one patella depth from the hip along
 * the thigh. The thigh rises to the elevation whose circle meets the
 * target's height, bounded by the hip's flexion range less the back lean
 * that tips the pelvis; the pelvis then travels horizontally along the line
 * toward the target until the knee's front is on it, forward (the hip thrust
 * of the clinch knee) or back (the hips drawn back to make room when the
 * opponent is chest to chest). The shank folds back under the knee by
 * {@link KneeForm.FLEXION}.
 */
export namespace KneeReach {
  /**
   * A solved knee: where its joint, ankle and pelvis go at the contact.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame and unit.
   * @evidence contracts/development/design.md#principled-representation World points for the knee and the ankle, a world displacement for the pelvis, a horizontal unit heading and the shared reach status.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What the plan poses and records.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the reach status union.
   */
  export interface ISolution {
    /** The knee joint, world metres. */
    knee: IAutoMovieVector3;

    /** The ankle folded under it, world metres. */
    ankle: IAutoMovieVector3;

    /** The pelvis's horizontal travel, world metres. */
    thrust: IAutoMovieVector3;

    /** The horizontal unit direction the thigh points in. */
    heading: IAutoMovieVector3;

    /** Whether the knee's front reaches the target, falls short, or is jammed. */
    status: StrikingReach.ISolution["status"];
  }

  /**
   * Solve the knee for a hip and a target.
   *
   * @param hip The kicking hip before the pelvis travels, world metres.
   * @param target The target point, world metres.
   * @param thigh The thigh length, metres.
   * @param patella The knee's front from its joint, metres.
   * @param shank The shank length, metres.
   * @param travel The pelvis's longest travel, metres.
   * @param fallback A horizontal unit direction for a target straight above or below the hip.
   * @returns The solution.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States every input's frame and unit and the fallback's use; the comments derive the elevation and the travel.
   * @evidence contracts/development/implementation.md#principled-implementation The thigh's elevation from the arcsine of the target's height over the thigh-plus-patella radius, bounded by the hip's flexion range less the lean; then the horizontal travel that closes the remaining distance, bounded by the travel limit; the shank folded by the knee's flexion in the thigh's vertical plane.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Elevation, travel and status, then the joints, in one closed form.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A target outside the thigh's range or travel is reported short or jammed rather than reached by a stretched leg; 1e-9 tolerances only absorb rounding at the bounds.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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
    const status: StrikingReach.ISolution["status"] =
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

  /**
   * A standing leg's knee from its hip and its ankle: the point one thigh
   * from the hip and one shank from the ankle, on the side a direction names.
   *
   * @param hip The hip joint, world metres.
   * @param ankle The ankle joint, world metres.
   * @param thigh The thigh length, metres.
   * @param shank The shank length, metres.
   * @param forward The side the knee bends to, a world direction not along the leg.
   * @returns The knee joint, world metres; on the hip-ankle line when the leg is at or past full stretch.
   */
  export function bent(
    hip: IAutoMovieVector3,
    ankle: IAutoMovieVector3,
    thigh: number,
    shank: number,
    forward: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const span: IAutoMovieVector3 = Vector3.subtract(ankle, hip);
    const d: number = Math.max(1e-9, Vector3.length(span));
    const along: IAutoMovieVector3 = Vector3.scale(span, 1 / d);

    // The foot of the knee's perpendicular on the hip-ankle line (law of
    // cosines), and the knee's height above it.
    const foot: number = Math.min(
      thigh,
      (thigh * thigh - shank * shank + d * d) / (2 * d),
    );
    const height: number = Math.sqrt(Math.max(0, thigh * thigh - foot * foot));
    const across: IAutoMovieVector3 = Vector3.subtract(
      forward,
      Vector3.scale(along, Vector3.dot(forward, along)),
    );
    const side: number = Vector3.length(across);
    return Vector3.add(
      Vector3.add(hip, Vector3.scale(along, foot)),
      side > 1e-9 ? Vector3.scale(across, height / side) : { x: 0, y: 0, z: 0 },
    );
  }

  /**
   * A unit direction swung toward another along the great arc between them.
   *
   * @param from The direction at share 0, unit.
   * @param to The direction at share 1, unit.
   * @param share How far along the arc, 0 to 1.
   * @returns The unit direction; `to` when the two are parallel or opposed, where the arc's plane is not defined.
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

  /**
   * The driven foot's axes under a shank: the toes pointed down by
   * {@link KneeForm.PLANTAR} from the foot's neutral, which is square to the
   * shank on the side the knee faces.
   *
   * @param shank The unit direction from the knee to the ankle.
   * @param heading The horizontal unit direction the knee faces.
   * @returns The toes' direction and the instep's, both unit, for `StrikingBody.foot`.
   */
  export function foot(
    shank: IAutoMovieVector3,
    heading: IAutoMovieVector3,
  ): { toes: IAutoMovieVector3; instep: IAutoMovieVector3 } {
    const front: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(heading, Vector3.scale(shank, Vector3.dot(heading, shank))),
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
