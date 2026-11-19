import { Vector3, clampPose } from "@automovie/engine";
import type {
  IAutoMovieHumanDigitGoal,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanDigitFit } from "../posture/HumanDigitFit";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import type { resolvePianoScoreVoicing } from "./resolvePianoScoreVoicing";

/**
 * Fit a voicing's digits from the arms already placed at a scored boundary.
 * An undepressed fit supplies the resting shape for transport. At each
 * checked chord boundary every digit must reach from the same fitted wrist.
 *
 * @param body The seated performer's rig.
 * @param arms The pose with both arm goals fitted at the boundary.
 * @param voicing The scored targets and their common hand shape.
 * @param down Whether the keys are at the bottom of their travel.
 * @returns The fitted angles of this hand.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Explains which pose is fitted and what the boundary check admits.
 * @evidence contracts/development/implementation.md#principled-implementation Uses the same digit goals and canonical world fingertip surfaces as playback.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Seed the shared hand, fit its active digits and measure the resulting contact.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Refuses a chord whose actual fitted tips miss the scored surfaces beyond the documented tolerance.
 * @evidence contracts/development/implementation.md#efficient-algorithms Fits the digits and resolves the necessary bones once at each checked boundary.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The at-rest fits are shared by the press and adjacent transports.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The resulting hand angles are the only values returned.
 */
export function fitPianoScoreContact(
  body: IAutoMovieMotionHumanBody,
  arms: IAutoMoviePose,
  voicing: resolvePianoScoreVoicing.Voicing,
  down: boolean,
): IAutoMovieMotionHumanPosture["joints"] {
  const { notes, shape } = voicing;
  const fingering: IAutoMoviePose = {
    ...arms,
    joints: arms.joints.map(
      (joint: IAutoMovieJointPose): IAutoMovieJointPose => {
        const angles: readonly [number, number, number] | undefined =
          shape[joint.bone];
        return angles === undefined
          ? joint
          : {
              ...joint,
              flexion: angles[0],
              abduction: angles[1],
              twist: angles[2],
            };
      },
    ),
  };
  const goals: NonNullable<IAutoMovieMotionHumanPosture["digits"]> = {};
  for (const note of notes)
    goals[note.digit] = {
      point: note.points[down ? 1 : 0],
      normal: note.normal,
      surface: "tip",
      contact: true,
    };
  const fitted: IAutoMoviePose = HumanDigitFit.fitted(
    body,
    clampPose(fingering, body.skeleton),
    goals,
  );
  if (notes.length > 1) {
    const bones: ReturnType<typeof poseBones> = poseBones(body, fitted);
    for (const { score, digit } of notes) {
      const goal: IAutoMovieHumanDigitGoal = goals[digit]!;
      const tip: IAutoMovieVector3 = HumanHand.frame(
        body,
        bones,
        score.side,
        `${score.digit}Tip` as IAutoMovieMotionHumanHand.DigitSurface,
      ).point;
      const miss: number = Vector3.length(Vector3.subtract(tip, goal.point));
      if (!(miss <= PIANO_CONTACT_TOLERANCE))
        throw new HumanRefusal({
          kind: "reach",
          axis: "notes.key",
          value: score.key,
          reason: `${digit} misses ${score.key} by ${miss.toFixed(4)} m from the shared wrist`,
          feasible: {
            kind: "range",
            minimum: 0,
            maximum: PIANO_CONTACT_TOLERANCE,
            unit: "m",
          },
          fix: "use a narrower chord or change the fingering or bench placement",
        });
    }
  }

  const out: IAutoMovieMotionHumanPosture["joints"] = { ...shape };
  for (const joint of fitted.joints)
    if (notes.some(({ digit }): boolean => joint.bone.startsWith(digit)))
      out[joint.bone] = [
        joint.flexion ?? 0,
        joint.abduction ?? 0,
        joint.twist ?? 0,
      ];
  return out;
}

/** Provisional 5 mm polygon-rig margin used by the piano score contact spec. */
const PIANO_CONTACT_TOLERANCE: number = 0.005;
