import type {
  IAutoMovieMotionHumanCrutchWalk,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { crutchWalkCourse } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/** A crutch staged on the floor, unturned. */
const STAGED: IAutoMovieRigidTransform = {
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
const P = (x: number, y: number, z: number): IAutoMovieVector3 => ({ x, y, z });

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
export function test_unit_motions_lexicon_crutch_walk_course(): void {
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
      crutchWalkCourse.stationed(STAGED, P(0, 0, 0), WALK.stations[1]).position,
      P(-0.3, 0, 0.5),
      1e-12,
    ) &&
      crutchWalkCourse.stationed(STAGED, P(0, 0, 0), undefined) === STAGED &&
      vclose(
        crutchWalkCourse.pivot(STAGED, { ...WALK, origin: P(1, 0, 1) }),
        P(1, 0, 1),
        0,
      ) &&
      vclose(crutchWalkCourse.pivot(STAGED, WALK), P(0.3, 0, 0.1), 0),
  );

  const moves: crutchWalkCourse.IAdvance[] = crutchWalkCourse.advances(
    STAGED,
    WALK,
    clock,
  );
  const position = (seconds: number): IAutoMovieVector3 =>
    crutchWalkCourse.frameAt(moves, STAGED, seconds).position;
  TestValidator.predicate(
    "the advances",
    moves.length === 2 &&
      vclose(moves[0]!.floor[1].position, P(0.3, 0, 0.4), 1e-12) &&
      vclose(moves[1]!.floor[1].position, P(0.3, 0, 0.7), 1e-12) &&
      vclose(position(0.2), P(0.3, 0, 0.1), 0) &&
      vclose(position(0.5 + 1 / 3), P(0.3, 0.04, 0.25), 1e-12) &&
      vclose(position(2), P(0.3, 0, 0.4), 1e-12) &&
      vclose(position(5), P(0.3, 0, 0.7), 1e-12),
  );
}
