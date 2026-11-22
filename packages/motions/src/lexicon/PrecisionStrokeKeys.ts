import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

/**
 * A precision stroke's key poses beyond its contact: how far a two-handed
 * swing's trunk coils back at the top and turns on at the finish, and the
 * window about the contact in which the tool's attitude is the one hard
 * constraint, the hands' goals carrying only their places elsewhere.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each key, its unit and its source or its provisional standing.
 * @evidence contracts/development/design.md#principled-representation Two angles of the trunk over the pelvis, one window in seconds and one reader of goals.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read only by `createPrecisionSportStroke`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The coil is the measured X-factor's lower bound; the finish is marked provisional where no measured value is common to the sources.
 */
export namespace PrecisionStrokeKeys {
  /**
   * The trunk's coil away from the shot at the top of a two-handed
   * backswing, degrees, of the shoulders over the pelvis: the X-factor,
   * about 45 to 60 degrees between the shoulders and the pelvis at the top
   * in golfers (Bourgain et al. 2022, Golf swing biomechanics: a systematic
   * review, Sports 10(6):91; the shoulders near 90 and the pelvis near 45 to
   * 53 degrees in Myers et al. 2008, Rotational biomechanics of the elite
   * golf swing, J Appl Biomech 24:181), its lower bound, the sources'
   * figures differing by method.
   */
  export const COIL: number = 45;

  /**
   * The trunk's turn on toward the shot at the finish of a two-handed swing,
   * degrees past its turn at the contact: the shoulders face the target at
   * the finish (provisional; no measured value is common to the golf and
   * batting sources).
   */
  export const FINISH: number = 90;

  /** Half the window about the contact in which the tool's attitude is held, seconds: one 24 Hz film frame. */
  export const CONTACT: number = 1 / 24;

  /**
   * Arm goals with their places only: away from the contact the hand's
   * rotation is left to the arm's course, which turns the implement as it
   * finds clear of the body.
   *
   * @param limbs A posture's limb goals.
   * @returns The same goals, the arms' without their rotation.
   */
  export function places(
    limbs: IAutoMovieMotionHumanPosture["limbs"],
  ): IAutoMovieMotionHumanPosture["limbs"] {
    const out: IAutoMovieMotionHumanPosture["limbs"] = { ...limbs };
    for (const limb of ["leftArm", "rightArm"] as const) {
      const goal: IAutoMovieHumanLimbGoal | undefined = out[limb];
      if (goal === undefined) continue;
      // A goal that places a held tool's contact turns with the hand, so
      // its place is the hand's own: the contact carried back through the
      // goal's rotation.
      const place: IAutoMovieHumanLimbGoal = { ...goal };
      if (goal.contact !== undefined && goal.rotation !== undefined)
        place.point = Vector3.subtract(
          goal.point,
          Quaternion.rotateVector(goal.rotation, goal.contact),
        );
      delete place.contact;
      delete place.rotation;
      out[limb] = place;
    }
    return out;
  }
}
