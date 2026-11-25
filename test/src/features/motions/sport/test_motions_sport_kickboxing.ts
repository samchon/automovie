import type {
  AutoMovieHumanoidRegion,
  IAutoMovieAffordance,
  IAutoMovieCheckLegality,
  IAutoMovieMotionHumanKickboxingRing,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionTarget,
  IAutoMovieSchedule,
  IAutoMovieScheduleEntry,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  KickboxingRing,
  KickboxingRules,
  KnockdownCount,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";
import { vclose } from "../../internal/vclose";

/** A contact point of a ring prop, in its own frame. */
const point = (id: string, at: IAutoMovieVector3): IAutoMovieAffordance => ({
  id,
  kind: "surface",
  frame: {
    translation: at,
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  },
  extent: null,
});

/**
 * A 6 m ring prop as `createRing` declares it, placed at (10, 0, 0) and turned
 * 90 degrees: its canvas at 1 m, its top ropes `east` metres out east and 3 m
 * out on the other sides, its posts' tops at the corners.
 */
const ring = (east: number): IAutoMovieMotionHumanProp => ({
  subject: "ring",
  frame: {
    position: { x: 10, y: 0, z: 0 },
    rotation: { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
  },
  points: {},
  affordances: [
    point("canvas", { x: 0, y: 1, z: 0 }),
    point("northRope", { x: 0, y: 2, z: 3 }),
    point("southRope", { x: 0, y: 2, z: -3 }),
    point("eastRope", { x: east, y: 2, z: 0 }),
    point("westRope", { x: -3, y: 2, z: 0 }),
    point("corner1", { x: 3, y: 2.2, z: 3 }),
    point("corner2", { x: -3, y: 2.2, z: 3 }),
    point("corner3", { x: -3, y: 2.2, z: -3 }),
    point("corner4", { x: 3, y: 2.2, z: -3 }),
  ],
});

/** A schedule entry of one action. */
const entry = (
  index: number,
  subject: string,
  capability: string,
  start: number,
  end: number,
  params?: object,
): IAutoMovieScheduleEntry => ({
  index,
  subject,
  start,
  end,
  intent: {
    subject,
    capability,
    ...(params === undefined ? {} : { parameters: { params } }),
  },
});

/**
 * The kickboxing ring and its rules (GLORY Official Rules V2.2).
 *
 * Scenarios:
 *
 * 1. `KickboxingRing` reads the placed ring's canvas at (10, 1, 0), its 6 m size
 *    and its 90 degree heading, and refuses ropes 6 m apart one way and 6.4 m
 *    the other.
 * 2. On a 6 m ring at (1, 0.5, 2) turned 90 degrees, the blue corner 0.5 m inside
 *    the ropes goes from the ring's `(+2.5, +2.5)` to world `(+2.5, -2.5)` from
 *    the centre.
 * 3. On a 6 m ring at the origin: a point 5 m out along +X clamps to 2.5 m with a
 *    0.5 m margin, at the floor's height; turned 45 degrees, a point 3.5 m
 *    along +X lies inside, one 4.5 m out does not.
 * 4. A punch to the jaw is legal and to the nape a foul (§5.07 A.2); a push kick
 *    at the thigh is a foul and a round kick legal (A.4).
 * 5. A knee touching another strike breaks the single clinch knee (A.11), alone it
 *    keeps it; a punch at the downed `b` before `b`'s next action breaks the
 *    downed rule, one after it does not.
 * 6. A fighter fallen near neutral A sends the other to neutral B (5.05.B.2), and
 *    the ten-count started at 3 s says ten at 13 s (5.05.B).
 */
export function test_motions_sport_kickboxing(): void {
  // 1. The placed ring.
  const read: IAutoMovieMotionHumanKickboxingRing.IRing = KickboxingRing(
    ring(3),
  );
  TestValidator.predicate(
    "the placed ring",
    vclose(read.centre, { x: 10, y: 1, z: 0 }, 1e-12) &&
      nclose(read.size, 6, 1e-12) &&
      nclose(read.yaw, 90, 1e-9) &&
      throwsError(() => KickboxingRing(ring(3.4))),
  );

  // 2. A corner.
  TestValidator.predicate(
    "the turned corner inside the ropes",
    vclose(
      KickboxingRing.corner(
        { centre: { x: 1, y: 0.5, z: 2 }, size: 6, yaw: 90 },
        "blue",
        0.5,
      ),
      { x: 3.5, y: 0.5, z: -0.5 },
      1e-12,
    ),
  );

  // 3. Inside the ropes.
  const square: IAutoMovieMotionHumanKickboxingRing.IRing = {
    centre: { x: 0, y: 0.4, z: 0 },
    size: 6,
    yaw: 0,
  };
  TestValidator.predicate(
    "clamped and inside",
    vclose(
      KickboxingRing.clamp(square, { x: 5, y: 0, z: 1 }, 0.5),
      { x: 2.5, y: 0.4, z: 1 },
      1e-12,
    ) &&
      KickboxingRing.inside({ ...square, yaw: 45 }, { x: 3.5, y: 0, z: 0 }) &&
      !KickboxingRing.inside({ ...square, yaw: 45 }, { x: 4.5, y: 0, z: 0 }),
  );

  // 4. Fouls.
  const at = (
    region: AutoMovieHumanoidRegion,
  ): { at: IAutoMovieMotionTarget } => ({
    at: { kind: "person", subject: "b", region },
  });
  TestValidator.equals(
    "legal and foul targets",
    [
      KickboxingRules.foul("punch", at("jawLeft")),
      KickboxingRules.foul("punch", at("nape")),
      KickboxingRules.foul("kick", {
        ...at("thighOuterLeft"),
        technique: "push",
      }),
      KickboxingRules.foul("kick", {
        ...at("thighOuterLeft"),
        technique: "round",
      }),
    ],
    [
      null,
      "a strike at the nape is a foul",
      "a linear kick at the thighOuterLeft is a foul",
      null,
    ],
  );

  // 5. The schedule rules.
  const rule = (id: string): IAutoMovieCheckLegality.IRule =>
    KickboxingRules.rules.find(
      (r: IAutoMovieCheckLegality.IRule): boolean => r.id === id,
    )!;
  const knee: IAutoMovieScheduleEntry = entry(1, "a", "knee", 1, 2);
  const clinch: IAutoMovieSchedule = {
    duration: 4,
    entries: [entry(0, "a", "punch", 0, 1), knee],
  };
  const early: IAutoMovieScheduleEntry = entry(
    2,
    "a",
    "punch",
    2,
    3,
    at("jawLeft"),
  );
  const late: IAutoMovieScheduleEntry = entry(
    3,
    "a",
    "punch",
    5,
    6,
    at("jawLeft"),
  );
  const fight: IAutoMovieSchedule = {
    duration: 6,
    entries: [
      entry(0, "b", "knockdown", 1, 2),
      entry(1, "b", "stand", 4, 5),
      early,
      late,
    ],
  };
  TestValidator.equals(
    "a single knee, and no strike while down",
    [
      rule("single-clinch-knee").check(knee, clinch),
      rule("single-clinch-knee").check(knee, { duration: 4, entries: [knee] }),
      rule("no-attack-on-a-downed-opponent").check(early, fight),
      rule("no-attack-on-a-downed-opponent").check(late, fight),
    ],
    [
      "knee 1 is not a single clinch knee",
      null,
      "entry 2 strikes b, who is down since 1.00 s",
      null,
    ],
  );

  // 6. The knockdown count.
  TestValidator.predicate(
    "the farther neutral corner and the ten",
    vclose(
      KnockdownCount.corner(
        { centre: { x: 0, y: 0, z: 0 }, size: 6, yaw: 0 },
        { x: 2, y: 0, z: -2 },
        0.5,
      ),
      { x: -2.5, y: 0, z: 2.5 },
      1e-12,
    ) && KnockdownCount.number(3, KnockdownCount.TEN) === 13,
  );
}
