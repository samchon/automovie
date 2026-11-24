import type { IAutoMovieMotionHumanAuditMotion } from "@automovie/interface";
import { AutoMovieMotionHumanAuditMotion } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieMotionHumanAuditMotion.feet` reads the floor under one foot of a
 * person on two levels: the lower of the person's floor and the ground the
 * foot's own bearing window declares, and, between its windows, the lower of
 * the grounds it left and lands on; never above the person's floor.
 *
 * Scenarios, one 3 s action: the right foot bears on a 0.3 m tread throughout;
 * the left bears on the 0 m floor to 1 s, then on the 0.3 m tread from 2 s:
 *
 * 1. At 0.5 s the person's floor is the lower, 0, and so is each foot's.
 * 2. At 1.5 s the left foot swings from the floor to the tread: its floor is the
 *    floor it left, 0, below the person's 0.3; the right foot's is the tread.
 * 3. At 2.5 s both bear on the tread: 0.3 for each.
 */
export function test_unit_motions_audit_auto_movie_motion_human_audit_motion_feet(): void {
  const motion: IAutoMovieMotionHumanAuditMotion = {
    duration: 3,
    bones: () => new Map(),
    segments: () => [
      {
        name: "step",
        start: 0,
        entryTime: 0,
        end: 3,
        plan: {
          duration: 3,
          contacts: [
            {
              part: "rightFoot",
              kind: "plant",
              from: 0,
              to: 1,
              support: { kind: "ground", height: 0.3 },
            },
            {
              part: "leftFoot",
              kind: "plant",
              from: 0,
              to: 1 / 3,
              support: { kind: "ground" },
            },
            {
              part: "leftFoot",
              kind: "plant",
              from: 2 / 3,
              to: 1,
              support: { kind: "ground", height: 0.3 },
            },
          ],
        },
      },
    ],
  };
  const left: (seconds: number) => number | null =
    AutoMovieMotionHumanAuditMotion.feet(motion, "a", "left");
  const right: (seconds: number) => number | null =
    AutoMovieMotionHumanAuditMotion.feet(motion, "a", "right");
  TestValidator.equals(
    "each foot's floor",
    [0.5, 1.5, 2.5].map((t: number): (number | null)[] => [
      AutoMovieMotionHumanAuditMotion.floors(motion, "a")(t),
      left(t),
      right(t),
    ]),
    [
      [0, 0, 0],
      [0.3, 0, 0.3],
      [0.3, 0.3, 0.3],
    ],
  );
}
