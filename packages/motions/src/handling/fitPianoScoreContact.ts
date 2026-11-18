import { clampPose } from "@automovie/engine";
import type {
  AutoMovieHumanDigit,
  IAutoMovieHumanDigitGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
} from "@automovie/interface";

import { HumanDigitFit } from "../posture/HumanDigitFit";

/**
 * Read one piano digit at a contact boundary. The arms have already been
 * fitted together at this instant. The returned angles are the starting or
 * ending hand shape of the transport between keys.
 *
 * @param body The seated performer's rig.
 * @param arms The pose with both arm goals fitted at the boundary.
 * @param shape The manipulation shape used to seed active key contact.
 * @param digit The pressing finger.
 * @param goal The undepressed key's contact point and normal.
 * @returns The fitted angles of this hand.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Explains the instant, inputs and transport endpoint.
 * @evidence contracts/development/implementation.md#principled-implementation Uses the same digit shape and fit as the displayed press, on the arms already posed together.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Apply the hand shape, fit its active digit, and read its joint angles.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads the actual fitted digit without replacing joint ranges or assuming a perfectly placed wrist.
 * @evidence contracts/development/implementation.md#efficient-algorithms Fits one digit at each authored endpoint, outside posture sampling.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The endpoints are shared by the press and adjacent transports.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The resulting hand angles are the only values returned.
 */
export function fitPianoScoreContact(
  body: IAutoMovieMotionHumanBody,
  arms: IAutoMoviePose,
  shape: IAutoMovieMotionHumanPosture["joints"],
  digit: AutoMovieHumanDigit,
  goal: IAutoMovieHumanDigitGoal,
): IAutoMovieMotionHumanPosture["joints"] {
  const fingering: IAutoMoviePose = {
    ...arms,
    joints: arms.joints.map((joint) => {
      const angles = shape[joint.bone];
      return angles === undefined
        ? joint
        : {
            ...joint,
            flexion: angles[0],
            abduction: angles[1],
            twist: angles[2],
          };
    }),
  };
  const fitted: IAutoMoviePose = HumanDigitFit.fitted(
    body,
    clampPose(fingering, body.skeleton),
    {
      [digit]: goal,
    },
  );
  const out: IAutoMovieMotionHumanPosture["joints"] = { ...shape };
  for (const joint of fitted.joints)
    if (joint.bone.startsWith(digit))
      out[joint.bone] = [
        joint.flexion ?? 0,
        joint.abduction ?? 0,
        joint.twist ?? 0,
      ];
  return out;
}
