import type {
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanContactWindow,
} from "@automovie/interface";
import { AutoMovieMotionHumanAuditMotion } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieMotionHumanAuditMotion.floors` reads the floor under a person from
 * the supports their bearing windows declare: the lowest ground bearing at an
 * instant; none while only a prop bears them; between contacts the ground the
 * last one ended on; the world plane before any; and a raised rest a socket
 * bears on gives no floor plane. Water takes the floor away where no ground
 * contact declares one.
 *
 * Scenarios, one 4 s action holding the person to the film's end:
 *
 * 1. At 0.1 s, before the first plant (the raised rest at 0.5 m a ball bears on
 *    does not count), the floor is the world plane, 0.
 * 2. At 0.4 s the left foot bears on a 0.3 m bank: 0.3.
 * 3. At 0.75 s the right foot bears on 0.1 m as well: the lower, 0.1.
 * 4. At 1.5 s, between contacts, the floor is the bank the first plant ended on,
 *    0.3, the earlier of the two that ended together.
 * 5. At 2.5 s a prop seat bears the person and at 3.5 s it was the last contact:
 *    no floor.
 * 6. Without any contact, in water there is no floor, out of it the world plane.
 */
export function test_unit_motions_audit_auto_movie_motion_human_audit_motion_floors(): void {
  const contacts: IAutoMovieMotionHumanContactWindow[] = [
    {
      part: "leftFoot",
      kind: "plant",
      from: 0.0625,
      to: 0.25,
      support: { kind: "ground", height: 0.3 },
    },
    {
      part: "rightFoot",
      kind: "plant",
      from: 0.125,
      to: 0.25,
      support: { kind: "ground", height: 0.1 },
    },
    {
      part: "rightFoot",
      kind: "plant",
      from: 0,
      to: 0.25,
      socket: "ball",
      support: { kind: "ground", height: 0.5 },
    },
    {
      part: "seat",
      kind: "seat",
      from: 0.5,
      to: 0.75,
      support: { kind: "prop", subject: "stool" },
    },
  ];
  const motion: IAutoMovieMotionHumanAuditMotion = {
    duration: 4,
    bones: () => new Map(),
    segments: () => [
      {
        name: "climb",
        start: 0,
        entryTime: 0,
        end: 4,
        plan: { duration: 4, contacts },
      },
    ],
  };
  const floor: (seconds: number) => number | null =
    AutoMovieMotionHumanAuditMotion.floors(motion, "a");
  TestValidator.equals(
    "the floor over the film",
    [0.1, 0.4, 0.75, 1.5, 2.5, 3.5].map(floor),
    [0, 0.3, 0.1, 0.3, null, null],
  );
  const bare = (water: boolean): IAutoMovieMotionHumanAuditMotion => ({
    duration: 1,
    bones: () => new Map(),
    segments: () => [],
    water: () => water,
  });
  TestValidator.equals(
    "water without a ground contact",
    [
      AutoMovieMotionHumanAuditMotion.floors(bare(true), "a")(0.5),
      AutoMovieMotionHumanAuditMotion.floors(bare(false), "a")(0.5),
    ],
    [null, 0],
  );
}
