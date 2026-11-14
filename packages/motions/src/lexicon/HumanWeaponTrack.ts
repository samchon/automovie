import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieMotionTarget,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { StrikingHeld } from "../striking/StrikingHeld";

/**
 * Tracking: a presented firearm kept on a target that moves (#3348). The
 * weapon is presented at where the target is when the action starts, and
 * with `track` the sight line then follows the target for as long as the
 * carriage is held.
 *
 * The presented pose is turned as one rigid piece about the eye, by the
 * least rotation that takes the first sight line onto the line from the eye
 * to where the target is at that second (`context.aim` at the film second):
 * the muzzle stays on the sight line and the hand keeps the turn about the
 * bore it was presented with, so the pose moves as steadily as the target
 * does. The eye is the presenting posture's and does not move.
 *
 * First pass: the arms alone follow, the trunk and the feet do not turn, so
 * a target that leaves the arc the arms present to is still followed and
 * the arm's fit then gives way silently; no lead is taken ahead of a moving
 * target, and the tracking has no lag or tremor by skill.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what tracking does, its geometry and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation One rotation of the presented pose per second, read from the target's own placed motion, so no second pose is solved and no choice of the fit can change between instants.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The one parameter and the path `present` gives its stroke planner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The target is read through `context.aim`, the reader every aimed law uses, at the second shown.
 */
export namespace HumanWeaponTrack {
  /** What tracking adds to presenting a weapon. */
  export interface IParams {
    /** What it is aimed at. */
    target?: AutoMovieMotionTarget;

    /** Whether the aim follows the target while the carriage is held; `false` when absent. */
    track?: boolean;
  }

  /**
   * The path of a presented weapon: the pose itself, or with `track` the
   * pose turned onto the target at each second.
   *
   * @param context The action's context.
   * @param pose The presented pose, aimed at `aimed`.
   * @param eye The eye the sight line starts from, world metres.
   * @param aimed Where the pose is aimed, world metres; null for a carriage that does not aim, which is never turned.
   * @returns The stroke planner's path.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The rotation is the one about the axis square to both sight lines by the angle between them, applied to the hand's point about the eye and to the hand's rotation; below a thousandth of a degree the pose is returned as it is.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One cross product, one angle, one rotated frame.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The target is read at the second shown, never extrapolated; the limits are stated on the namespace.
   * @evidence contracts/development/implementation.md#efficient-algorithms One target read and constant arithmetic per evaluated second.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Postures are evaluated independently; nothing is cached.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The path closes over the pose, the eye and the context.
   */
  export function path(
    context: IHumanActionContext<IParams>,
    pose: StrikingHeld.IHandFrame,
    eye: IAutoMovieVector3,
    aimed: IAutoMovieVector3 | null,
  ): (progress: number, seconds: number) => StrikingHeld.IHandFrame {
    const target: AutoMovieMotionTarget | undefined = context.params.target;
    if (aimed === null || target === undefined || context.params.track !== true)
      return (): StrikingHeld.IHandFrame => pose;
    const first: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(aimed, eye),
    );
    return (_: number, seconds: number): StrikingHeld.IHandFrame => {
      const now: IAutoMovieVector3 = Vector3.normalize(
        Vector3.subtract(
          context.aim(target, context.start + seconds).point,
          eye,
        ),
      );
      const axis: IAutoMovieVector3 = Vector3.cross(first, now);
      const sine: number = Vector3.length(axis);
      const degrees: number =
        (Math.atan2(sine, Vector3.dot(first, now)) * 180) / Math.PI;
      if (!(degrees > 0.001)) return pose;
      const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
        Vector3.scale(axis, 1 / sine),
        degrees,
      );
      return {
        point: Vector3.add(
          eye,
          Quaternion.rotateVector(turn, Vector3.subtract(pose.point, eye)),
        ),
        rotation: Quaternion.multiply(turn, pose.rotation),
      };
    };
  }
}
