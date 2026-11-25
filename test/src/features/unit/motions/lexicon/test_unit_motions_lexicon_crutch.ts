import type {
  IAutoMovieAffordance,
  IAutoMovieHumanLimbGoal,
  IAutoMovieHumanLimbReference,
  IAutoMovieMotionHumanCrutchStairs,
  IAutoMovieMotionHumanCrutchWalk,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  crutchHeldLeg,
  crutchHeldLegSweptDepth,
  crutchSitKit,
  crutchSitPath,
  crutchStairsFlight,
  crutchWalkCourse,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/** A leg straight. */
const STRAIGHT: IAutoMovieHumanLimbReference = {
  upper: [0, 0, 0],
  lower: [0, 0, 0],
};

/** A leg held, the hip 30 and the knee 80 degrees. */
const HELD: IAutoMovieHumanLimbReference = {
  upper: [30, 0, 0],
  lower: [80, 0, 0],
};

/** Two hand goals a metre apart. */
const NEAR: IAutoMovieHumanLimbGoal = {
  point: { x: 0, y: 1, z: 0 },
  bend: { x: 0, y: 0, z: 1 },
};
const FAR: IAutoMovieHumanLimbGoal = {
  point: { x: 1, y: 1, z: 0 },
  bend: { x: 0, y: 0, z: 1 },
};

/**
 * The crutch sit's kit helpers: a held leg's angles and a hand goal on a
 * minimum-jerk share between two, clamped to the share's range, and a heading's
 * level forward and side units.
 *
 * Scenarios:
 *
 * 1. Half way the leg is half way, the hip at 15 and the knee at 40; past the end
 *    it is held.
 * 2. Half way the goal is half way; before the start it is the first.
 * 3. Facing +Z (yaw 0) forward is +Z and the left is +X; turned 90 degrees forward
 *    is +X and the right is +Z.
 */
function scenario_test_unit_motions_lexicon_crutch_sit_kit(): void {
  const half: IAutoMovieHumanLimbReference = crutchSitKit.leg(
    0.5,
    STRAIGHT,
    HELD,
  );
  TestValidator.predicate(
    "the leg",
    half.upper[0] === 15 &&
      half.lower[0] === 40 &&
      crutchSitKit.leg(2, STRAIGHT, HELD).lower[0] === 80,
  );
  TestValidator.predicate(
    "the goal",
    vclose(
      crutchSitKit.blend(NEAR, FAR, 0.5).point,
      { x: 0.5, y: 1, z: 0 },
      1e-12,
    ) && vclose(crutchSitKit.blend(NEAR, FAR, -1).point, NEAR.point, 0),
  );
  TestValidator.predicate(
    "the units",
    vclose(crutchSitKit.forward(0), { x: 0, y: 0, z: 1 }, 1e-12) &&
      vclose(crutchSitKit.lateral(0, "left"), { x: 1, y: 0, z: 0 }, 1e-12) &&
      vclose(crutchSitKit.forward(90), { x: 1, y: 0, z: 0 }, 1e-12) &&
      vclose(crutchSitKit.lateral(90, "right"), { x: 0, y: 0, z: 1 }, 1e-12),
  );
}

/** No turn. */
const IDENTITY: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };

/** A contact at a point of the crutch. */
const contact = (id: string, y: number): IAutoMovieAffordance => ({
  id,
  kind: id === "grip" ? "handle" : "surface",
  frame: {
    translation: { x: 0, y, z: 0 },
    rotation: IDENTITY,
    scale: { x: 1, y: 1, z: 1 },
  },
  extent: null,
});

/** A crutch whose tip is at its origin and whose grip is 0.8 m up its shaft. */
const CRUTCH: crutchSitPath.ICrutch = crutchSitPath.crutch("crutch", [
  contact("grip", 0.8),
  contact("tip", 0),
]);

/** A point. */
const P = (x: number, y: number, z: number): IAutoMovieVector3 => ({ x, y, z });

/**
 * `crutchSitPath` reads a crutch's grip and tip, stands it on its tip and
 * carries it between frames on a minimum-jerk share, its tip lifted 4 cm at the
 * move's middle.
 *
 * Scenarios:
 *
 * 1. The crutch's grip is 0.8 m above its tip; a crutch with no tip is refused.
 * 2. Stood upright on a tip at (1, 0, 2), handgrip facing +Z, it is unturned and
 *    placed there.
 * 3. Carried half way between two upright frames a metre apart, it is half way and
 *    4 cm up; past the end it is at the second.
 */
function scenario_test_unit_motions_lexicon_crutch_sit_path(): void {
  TestValidator.predicate(
    "the crutch",
    nclose(CRUTCH.length, 0.8, 1e-12) && vclose(CRUTCH.grip, P(0, 0.8, 0), 0),
  );
  TestValidator.error("no tip", () =>
    crutchSitPath.crutch("crutch", [contact("grip", 0.8)]),
  );

  const stood: IAutoMovieRigidTransform = crutchSitPath.slid(
    CRUTCH,
    P(1, 0, 2),
    P(1, 1, 2),
    P(0, 0, 1),
  );
  TestValidator.predicate(
    "stood upright",
    vclose(stood.position, P(1, 0, 2), 1e-12) &&
      Math.abs(Math.abs(stood.rotation.w) - 1) < 1e-12,
  );

  const from: IAutoMovieRigidTransform = {
    position: P(0, 0, 0),
    rotation: IDENTITY,
  };
  const to: IAutoMovieRigidTransform = {
    position: P(1, 0, 0),
    rotation: IDENTITY,
  };
  TestValidator.predicate(
    "carried",
    vclose(
      crutchSitPath.carried(from, to, 0.5).position,
      P(0.5, 0.04, 0),
      1e-12,
    ) && vclose(crutchSitPath.carried(from, to, 2).position, P(1, 0, 0), 1e-12),
  );
}

/** Two steps up on the default riser and tread, two seconds a step. */
const UP: IAutoMovieMotionHumanCrutchStairs = {
  count: 2,
  left: "crutch-l",
  right: "crutch-r",
};

/** A crutch staged at the origin, turned to face +X. */
const STAGED: IAutoMovieRigidTransform = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
};

/** The minimum-jerk share, `10 s³ − 15 s⁴ + 6 s⁵`. */
const share = (s: number): number => s * s * s * (10 - 15 * s + 6 * s * s);

/**
 * `crutchStairsFlight` resolves a crutch stair climb's shape and clock and
 * reads its treads and its crutches' frames from them.
 *
 * Two steps up on a 0.17 m riser and a 0.28 m tread, the first nosing 0.05 m
 * ahead, two seconds a step, so the climb is ready at 0.5 s and the crutches
 * move over each step's second half.
 *
 * Scenarios:
 *
 * 1. The crutches move from 1.5 to 2.5 s and 3.5 to 4.5 s going up, over each
 *    step's first half going down.
 * 2. The second tread's landing is 0.34 m up and `0.05 + 1.7 · 0.28` m ahead; the
 *    profile starts each tread at its nosing.
 * 3. A crutch staged facing +X stands at the entry floor before its move, on the
 *    first tread between the moves and on the second after them; in the middle
 *    of its first move it is up its riser and lift, 0.21 m, and along by the
 *    minimum-jerk share of 2/7.
 * 4. The sound foot has arrived on a tread for a window opening after its step's
 *    start going up, after its middle going down.
 * 5. A riser above 0.35 of the hip height is refused.
 */
function scenario_test_unit_motions_lexicon_crutch_stairs_flight(): void {
  const climb: crutchStairsFlight.IClimb = crutchStairsFlight.resolve(
    UP,
    undefined,
    undefined,
  );
  const down: crutchStairsFlight.IClimb = crutchStairsFlight.resolve(
    { ...UP, direction: "down" },
    undefined,
    undefined,
  );
  TestValidator.equals("the moves going up", climb.moves, [
    { from: 1.5, to: 2.5, level: 0 },
    { from: 3.5, to: 4.5, level: 1 },
  ]);
  TestValidator.equals("the moves going down", down.moves, [
    { from: 0.5, to: 1.5, level: 0 },
    { from: 2.5, to: 3.5, level: 1 },
  ]);

  TestValidator.predicate(
    "the second tread's landing",
    vclose(
      crutchStairsFlight.level(climb, 2),
      { x: 0, y: 0.34, z: 0.05 + 1.7 * 0.28 },
      1e-12,
    ),
  );
  const profile: crutchHeldLeg.IStep[] = crutchStairsFlight.profile(climb, 1);
  TestValidator.predicate(
    "the profile",
    profile.length === 3 &&
      profile[0]!.from === -Infinity &&
      profile[0]!.height === 1 &&
      nclose(profile[1]!.from, 0.05, 1e-12) &&
      nclose(profile[1]!.height, 1.17, 1e-12) &&
      nclose(profile[2]!.from, 0.33, 1e-12) &&
      nclose(profile[2]!.height, 1.34, 1e-12),
  );

  const first: number = 0.05 + 0.7 * 0.28;
  const position = (seconds: number): IAutoMovieVector3 =>
    crutchStairsFlight.frameAt(climb, STAGED, seconds).position;
  TestValidator.predicate(
    "the crutch's frames",
    vclose(position(1), { x: 0, y: 0, z: 0 }, 1e-12) &&
      vclose(position(3), { x: first, y: 0.17, z: 0 }, 1e-12) &&
      vclose(position(5), { x: 0.05 + 1.7 * 0.28, y: 0.34, z: 0 }, 1e-12) &&
      vclose(position(2), { x: first * share(2 / 7), y: 0.21, z: 0 }, 1e-12),
  );

  TestValidator.predicate(
    "the treads arrived on",
    crutchStairsFlight.arrived(climb, 0.4) === 0 &&
      crutchStairsFlight.arrived(climb, 1) === 1 &&
      crutchStairsFlight.arrived(climb, 3) === 2 &&
      crutchStairsFlight.arrived(down, 1) === 0 &&
      crutchStairsFlight.arrived(down, 2) === 1,
  );

  TestValidator.error("a riser too high", () =>
    crutchStairsFlight.resolve(UP, 0.4, undefined),
  );
}

/** The entry floor and a 0.2 m tread from 1 m ahead. */
const FLIGHT: crutchHeldLeg.IStep[] = [
  { from: -Infinity, height: 0 },
  { from: 1, height: 0.2 },
];

/**
 * `crutchHeldLegSweptDepth` is a swept point's least signed distance from a
 * flight's solid in its climb's plane: each level the region under its height
 * from where it begins to where the next does, searched along the chord by
 * golden section (Kiefer 1953).
 *
 * Scenarios, the entry floor and a 0.2 m tread from 1 m ahead:
 *
 * 1. A point 0.5 m ahead and 0.1 m up, not swept, is 0.1 m over the floor and 0.5
 *    m short of the tread: 0.1.
 * 2. Swept level at that height to 1.5 m ahead it ends 0.1 m into the tread: −0.1.
 * 3. Swept level at 0.5 m up from the start to 2 m ahead it passes 0.3 m over the
 *    tread at its nearest.
 */
function scenario_test_unit_motions_lexicon_crutch_swept_depth(): void {
  TestValidator.predicate(
    "a point",
    nclose(crutchHeldLegSweptDepth(FLIGHT, [0.5, 0.1], [0.5, 0.1]), 0.1, 1e-12),
  );
  TestValidator.predicate(
    "into the tread",
    nclose(
      crutchHeldLegSweptDepth(FLIGHT, [0.5, 0.1], [1.5, 0.1]),
      -0.1,
      1e-12,
    ),
  );
  TestValidator.predicate(
    "over the tread",
    nclose(crutchHeldLegSweptDepth(FLIGHT, [0, 0.5], [2, 0.5]), 0.3, 1e-12),
  );
}

/**
 * `crutchHeldLeg.timesteps` cuts the held leg's fold into TrajOpt's evenly
 * spaced timesteps, its arm trajectories' eleven (Schulman et al. 2013, RSS,
 * section VI), and keeps the law's contact events after the held pose as
 * timesteps of their own.
 *
 * The leg lifts at 1 s and is held at 2 s; the law's events are at 1.5, 2.4 and
 * 2.4 + 0.25 s.
 *
 * Scenarios:
 *
 * 1. Eleven timesteps from the lift to the held pose, a tenth of a second apart,
 *    the first at the lift and the eleventh at the held pose.
 * 2. The events after the held pose follow unchanged; the one before it is
 *    dropped.
 * 3. With no events the fold's eleven timesteps are all.
 */
function scenario_test_unit_motions_lexicon_crutch_timesteps(): void {
  const steps: number[] = crutchHeldLeg.timesteps(1, 2, [1.5, 2.4, 2.65]);
  TestValidator.predicate(
    "eleven even timesteps from the lift to the held pose",
    steps
      .slice(0, 11)
      .every((t: number, i: number): boolean => nclose(t, 1 + i / 10, 1e-12)) &&
      steps[0] === 1 &&
      steps[10] === 2,
  );
  TestValidator.equals("the later events follow", steps.slice(11), [2.4, 2.65]);
  TestValidator.equals(
    "no events, the fold alone",
    crutchHeldLeg.timesteps(1, 2).length,
    11,
  );
}

/** A crutch staged on the floor, unturned. */
const STAGED_CRUTCH_WALK_COURSE: IAutoMovieRigidTransform = {
  position: { x: 0.3, y: 0, z: 0.1 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
};

/** Two stations of two seconds: 0.3 m on, then 0.6 m on turned about. */
const WALK: IAutoMovieMotionHumanCrutchWalk = {
  left: "crutch-l",
  right: "crutch-r",
  stations: [
    { x: 0, z: 0.3, seconds: 2 },
    { x: 0, z: 0.6, turn: 180, seconds: 2 },
  ],
};

/** A point. */
const P_CRUTCH_WALK_COURSE = (
  x: number,
  y: number,
  z: number,
): IAutoMovieVector3 => ({ x, y, z });

/**
 * `crutchWalkCourse` times a crutch walk and moves each crutch from station to
 * station: an opening stance of a quarter of the first station, then per
 * station the crutches' advance over its first third and the body's swing over
 * the rest; each crutch carried with the walker, `p' = p + d + (R − I)(p −
 * pivot)`, and lifted 4 cm at the middle of its minimum-jerk advance.
 *
 * Scenarios:
 *
 * 1. The clock opens at 0.5 s; the first station's crutches lift then and plant
 *    2/3 s later, its swing landing at 2.5 s, and the second follows. A walk
 *    with no station, or a station of no time, is refused.
 * 2. Turned about the origin, a point 0.3 m aside and 0.1 m on, carried 0.6 m on,
 *    comes to −0.3 aside and 0.5 m on; the pivot is the walk's origin, or the
 *    crutch's own tip on the floor.
 * 3. About its own tip the crutch advances 0.3 m and then 0.3 m more, turned in
 *    place; half way through its first advance it is half way along and 4 cm
 *    up; between advances it stands planted.
 */
function scenario_test_unit_motions_lexicon_crutch_walk_course(): void {
  const clock: crutchWalkCourse.IClock = crutchWalkCourse.clock(WALK);
  TestValidator.predicate(
    "the clock",
    clock.ready === 0.5 &&
      clock.stations.length === 2 &&
      clock.stations[0]!.lift === 0.5 &&
      nclose(clock.stations[0]!.plant, 0.5 + 2 / 3, 1e-12) &&
      clock.stations[0]!.land === 2.5 &&
      clock.stations[1]!.lift === 2.5 &&
      clock.stations[1]!.land === 4.5,
  );
  TestValidator.error("no station", () =>
    crutchWalkCourse.clock({ ...WALK, stations: [] }),
  );
  TestValidator.error("a station of no time", () =>
    crutchWalkCourse.clock({ ...WALK, stations: [{ x: 0, z: 0, seconds: 0 }] }),
  );

  TestValidator.predicate(
    "carried with the walker",
    vclose(
      crutchWalkCourse.stationed(
        STAGED_CRUTCH_WALK_COURSE,
        P_CRUTCH_WALK_COURSE(0, 0, 0),
        WALK.stations[1],
      ).position,
      P_CRUTCH_WALK_COURSE(-0.3, 0, 0.5),
      1e-12,
    ) &&
      crutchWalkCourse.stationed(
        STAGED_CRUTCH_WALK_COURSE,
        P_CRUTCH_WALK_COURSE(0, 0, 0),
        undefined,
      ) === STAGED_CRUTCH_WALK_COURSE &&
      vclose(
        crutchWalkCourse.pivot(STAGED_CRUTCH_WALK_COURSE, {
          ...WALK,
          origin: P_CRUTCH_WALK_COURSE(1, 0, 1),
        }),
        P_CRUTCH_WALK_COURSE(1, 0, 1),
        0,
      ) &&
      vclose(
        crutchWalkCourse.pivot(STAGED_CRUTCH_WALK_COURSE, WALK),
        P_CRUTCH_WALK_COURSE(0.3, 0, 0.1),
        0,
      ),
  );

  const moves: crutchWalkCourse.IAdvance[] = crutchWalkCourse.advances(
    STAGED_CRUTCH_WALK_COURSE,
    WALK,
    clock,
  );
  const position = (seconds: number): IAutoMovieVector3 =>
    crutchWalkCourse.frameAt(moves, STAGED_CRUTCH_WALK_COURSE, seconds)
      .position;
  TestValidator.predicate(
    "the advances",
    moves.length === 2 &&
      vclose(
        moves[0]!.floor[1].position,
        P_CRUTCH_WALK_COURSE(0.3, 0, 0.4),
        1e-12,
      ) &&
      vclose(
        moves[1]!.floor[1].position,
        P_CRUTCH_WALK_COURSE(0.3, 0, 0.7),
        1e-12,
      ) &&
      vclose(position(0.2), P_CRUTCH_WALK_COURSE(0.3, 0, 0.1), 0) &&
      vclose(
        position(0.5 + 1 / 3),
        P_CRUTCH_WALK_COURSE(0.3, 0.04, 0.25),
        1e-12,
      ) &&
      vclose(position(2), P_CRUTCH_WALK_COURSE(0.3, 0, 0.4), 1e-12) &&
      vclose(position(5), P_CRUTCH_WALK_COURSE(0.3, 0, 0.7), 1e-12),
  );
}

/**
 * The crutch laws' own logic: the sit kit and path, the stair flight, the held
 * leg's swept depth and timesteps, and the walk course, each scenario below.
 */
export function test_unit_motions_lexicon_crutch(): void {
  scenario_test_unit_motions_lexicon_crutch_sit_kit();
  scenario_test_unit_motions_lexicon_crutch_sit_path();
  scenario_test_unit_motions_lexicon_crutch_stairs_flight();
  scenario_test_unit_motions_lexicon_crutch_swept_depth();
  scenario_test_unit_motions_lexicon_crutch_timesteps();
  scenario_test_unit_motions_lexicon_crutch_walk_course();
}
