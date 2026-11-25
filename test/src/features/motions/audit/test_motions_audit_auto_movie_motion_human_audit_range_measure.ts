import type {
  IAutoMovieJointPose,
  IAutoMovieMotionHumanAuditRange,
} from "@automovie/interface";
import { AutoMovieMotionHumanAuditRange } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Rounding of a subtraction, degrees. */
const ROUNDING: number = 1e-9;

/**
 * `AutoMovieMotionHumanAuditRange.measure` reads each displayed joint against
 * the humanoid range table: an angle past its interval overshoots by its
 * distance to the nearer bound, an angle on an axis the joint lacks by its
 * magnitude; `share` is the part of the grid's instants with some joint past.
 *
 * The elbow's row (`DEFAULT_HUMANOID_ROM.leftLowerArm`) allows flexion 0 to 150
 * degrees and no abduction (the elbow is a hinge, AAOS norms).
 *
 * Scenarios, 1 s read at 4 Hz (five instants):
 *
 * 1. An elbow bent 90 degrees throughout is within range: nothing read.
 * 2. One bent 160 degrees from 0.5 s overshoots by 10 at 0.5 s on its flexion, at
 *    three of the five instants (0.6).
 * 3. One abducted 5 degrees throughout overshoots by 5 on its abduction at every
 *    instant.
 * 4. A joint the table does not list (the hips, whose turn is the root's) is
 *    unconstrained.
 */
export function test_motions_audit_auto_movie_motion_human_audit_range_measure(): void {
  const posed = (
    joint: (t: number) => IAutoMovieJointPose,
  ): IAutoMovieMotionHumanAuditRange.IPosed => ({
    duration: 1,
    pose: (_subject: string, t: number) => ({
      skeleton: "humanoid",
      root: null,
      joints: [joint(t)],
    }),
  });
  const elbow =
    (flexion: number, abduction: number | null) => (): IAutoMovieJointPose => ({
      bone: "leftLowerArm",
      flexion,
      abduction,
      twist: 0,
    });
  TestValidator.equals(
    "within range",
    AutoMovieMotionHumanAuditRange.measure(posed(elbow(90, null)), "a", 4),
    { overshoot: { value: 0, seconds: 0, where: "none" }, share: 0 },
  );
  const bent: IAutoMovieMotionHumanAuditRange.IResult =
    AutoMovieMotionHumanAuditRange.measure(
      posed(
        (t: number): IAutoMovieJointPose => ({
          bone: "leftLowerArm",
          flexion: t >= 0.5 ? 160 : 90,
          abduction: null,
          twist: 0,
        }),
      ),
      "a",
      4,
    );
  TestValidator.predicate(
    "past its flexion",
    nclose(bent.overshoot.value, 10, ROUNDING) &&
      bent.overshoot.seconds === 0.5 &&
      bent.overshoot.where === "leftLowerArm flexion" &&
      nclose(bent.share, 0.6, ROUNDING),
  );
  const abducted: IAutoMovieMotionHumanAuditRange.IResult =
    AutoMovieMotionHumanAuditRange.measure(posed(elbow(90, 5)), "a", 4);
  TestValidator.predicate(
    "on an axis it lacks",
    nclose(abducted.overshoot.value, 5, ROUNDING) &&
      abducted.overshoot.where === "leftLowerArm abduction" &&
      abducted.share === 1,
  );
  TestValidator.equals(
    "unlisted",
    AutoMovieMotionHumanAuditRange.measure(
      posed(
        (): IAutoMovieJointPose => ({
          bone: "hips",
          flexion: 400,
          abduction: 400,
          twist: 400,
        }),
      ),
      "a",
      4,
    ).share,
    0,
  );
}
