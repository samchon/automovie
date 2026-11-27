import {
  Vector3,
  AutoMovieEngineKinematics,
} from "@automovie/engine";
import type {
  IAutoMovieHumanDigitGoal,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanDigitFit } from "../../posture/internal/HumanDigitFit";
import { HumanHand } from "../../posture/internal/HumanHand";
import { poseBones } from "../../posture/internal/poseBones";
import type { resolvePianoScoreVoicing } from "./resolvePianoScoreVoicing";

/**
 * Fit a voicing's digits from the arms already placed at a scored boundary. An
 * undepressed fit supplies the resting shape for transport. At each checked
 * chord boundary every digit must reach from the same fitted wrist.
 *
 * @param body The seated performer's rig.
 * @param arms The pose with both arm goals fitted at the boundary.
 * @param voicing The scored targets and their common hand shape.
 * @param down Whether the keys are at the bottom of their travel.
 * @returns The fitted angles of this hand.
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
    AutoMovieEngineKinematics.clampPose(fingering, body.skeleton),
    goals,
  );
  if (notes.length > 1) {
    const bones: ReturnType<typeof poseBones> = poseBones(body, fitted);
    for (const { score, digit } of notes) {
      const goal: IAutoMovieHumanDigitGoal = goals[digit]!;
      const tip: IAutoMovieVector3 = HumanHand.frame(
        body,
        bones,
        score.hand,
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
