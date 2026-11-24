import type {
  IAutoMovieMotionHumanCrutchStairs,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { crutchHeldLeg, crutchStairsFlight } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

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
export function test_unit_motions_lexicon_crutch_stairs_flight(): void {
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
