import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieMotionHumanWeaponTrack,
  IAutoMovieMotionTarget,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * Tracking: a presented firearm kept on a target that moves. The weapon is
 * presented at where the target is when the action starts, and with `track` the
 * sight line then follows the target for as long as the carriage is held.
 *
 * The presented pose is turned as one rigid piece about the eye, by the least
 * rotation that takes the first sight line onto the line from the eye to where
 * the target is at that second (`context.aim` at the film second): the muzzle
 * stays on the sight line and the hand keeps the turn about the bore it was
 * presented with, so the pose moves as steadily as the target does. The eye is
 * the presenting posture's and does not move.
 *
 * First pass: the arms alone follow, the trunk and the feet do not turn, so a
 * target that leaves the arc the arms present to is still followed and the
 * arm's fit then gives way silently; no lead is taken ahead of a moving target,
 * and the tracking has no lag or tremor by skill.
 */
export namespace HumanWeaponTrack {
  /*
   * The path of a presented weapon: the pose itself, or with `track` the pose
   * turned onto the target at each second.
   * Parameter context: The action's context.
   * Parameter pose: The presented pose, aimed at `aimed`.
   * Parameter eye: The eye the sight line starts from, world metres.
   * Parameter aimed: Where the pose is aimed, world metres; null for a carriage
   * that does not aim, which is never turned.
   * Returns: The stroke planner's path.
   */
  export function path(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanWeaponTrack.IParams>,
    pose: IAutoMovieMotionHumanStrikingHeld.IHandFrame,
    eye: IAutoMovieVector3,
    aimed: IAutoMovieVector3 | null,
  ): (
    progress: number,
    seconds: number,
  ) => IAutoMovieMotionHumanStrikingHeld.IHandFrame {
    const target: IAutoMovieMotionTarget | undefined = context.params.target;
    if (aimed === null || target === undefined || context.params.track !== true)
      return (): IAutoMovieMotionHumanStrikingHeld.IHandFrame => pose;
    const first: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(aimed, eye),
    );
    return (
      _: number,
      seconds: number,
    ): IAutoMovieMotionHumanStrikingHeld.IHandFrame => {
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
