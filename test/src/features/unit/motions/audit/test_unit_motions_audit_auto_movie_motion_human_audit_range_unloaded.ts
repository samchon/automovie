import { ANKLE_DORSIFLEXION } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanAuditRange,
  IAutoMovieMotionHumanContactWindow,
} from "@automovie/interface";
import { AutoMovieMotionHumanAuditRange } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of a subtraction, degrees. */
const ROUNDING: number = 1e-9;

/**
 * Both ankles' dorsiflexion, degrees: within the loaded limit, past the
 * unloaded.
 */
const FLEXION: number = 30;

/**
 * `AutoMovieMotionHumanAuditRange.unloaded` reads a foot that bears no weight
 * against the unloaded ankle's dorsiflexion limit, 20 degrees (AAOS norms,
 * `ANKLE_DORSIFLEXION.unloaded`); a foot a plant, pivot or bearing window holds
 * is not read, and an instant both feet are held reads no pose.
 *
 * Scenarios, 1 s read at 4 Hz, both ankles dorsiflexed 30 degrees, the right
 * foot planted throughout and the left to 0.5 s:
 *
 * 1. From 0.75 s the left foot bears nothing and overshoots by 30 - 20 = 10
 *    degrees, first at 0.75 s: two of the five instants (0.4).
 * 2. The instants both feet are planted resolve no pose.
 * 3. Planted throughout, neither foot is read, whether the left foot is planted on
 *    the ground or on a prop that bears it (a stirrup).
 */
export function test_unit_motions_audit_auto_movie_motion_human_audit_range_unloaded(): void {
  const read: number[] = [];
  const posed: IAutoMovieMotionHumanAuditRange.IPosed = {
    duration: 1,
    pose: (_subject: string, t: number) => {
      read.push(t);
      return {
        skeleton: "humanoid",
        root: null,
        joints: (["leftFoot", "rightFoot"] as const).map((bone) => ({
          bone,
          flexion: FLEXION,
          abduction: 0,
          twist: null,
        })),
      };
    },
  };
  const planted = (
    left: number,
    support: IAutoMovieMotionHumanContactWindow.Support = { kind: "ground" },
  ): IAutoMovieMotionHumanAuditMotion => ({
    duration: 1,
    bones: () => new Map(),
    segments: () => [
      {
        name: "stand",
        start: 0,
        entryTime: 0,
        end: 1,
        plan: {
          duration: 1,
          contacts: [
            {
              part: "leftFoot",
              kind: "plant",
              from: 0,
              to: left,
              support,
            },
            {
              part: "rightFoot",
              kind: "plant",
              from: 0,
              to: 1,
              support: { kind: "ground" },
            },
          ],
        },
      },
    ],
  });
  const lifted: IAutoMovieMotionHumanAuditRange.IResult =
    AutoMovieMotionHumanAuditRange.unloaded(planted(0.5), posed, "a", 4);
  TestValidator.predicate(
    "a lifted foot",
    nclose(
      lifted.overshoot.value,
      FLEXION - ANKLE_DORSIFLEXION.unloaded,
      ROUNDING,
    ) &&
      lifted.overshoot.seconds === 0.75 &&
      lifted.overshoot.where === "leftFoot flexion unloaded" &&
      nclose(lifted.share, 0.4, ROUNDING),
  );
  TestValidator.equals("only the lifted instants read", read, [0.75, 1]);
  TestValidator.equals(
    "both planted",
    AutoMovieMotionHumanAuditRange.unloaded(planted(1), posed, "a", 4),
    { overshoot: { value: 0, seconds: 0, where: "none" }, share: 0 },
  );
  TestValidator.equals(
    "planted on a prop",
    AutoMovieMotionHumanAuditRange.unloaded(
      planted(1, { kind: "prop", subject: "stirrup" }),
      posed,
      "a",
      4,
    ),
    { overshoot: { value: 0, seconds: 0, where: "none" }, share: 0 },
  );
}
