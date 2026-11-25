import type {
  IAutoMovieMotionHumanBallPlay,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { HumanBallPlay } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";
import { vclose } from "../../../internal/vclose";

/**
 * How near the crossing's second comes to the true one, seconds: the 1/240 s
 * step halved by each of the 40 bisection rounds.
 */
const BISECTION: number = 1 / 240 / 2 ** 40;

/** A ball flying along +Z at 2 m/s, 1 m up, `x` metres aside. */
const flying = (x: number): Pick<IAutoMovieMotionHumanPerformance, "prop"> => ({
  prop: (_subject: string, seconds: number): IAutoMovieRigidTransform => ({
    position: { x, y: 1, z: 2 * seconds },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  }),
});

/**
 * `HumanBallPlay.crossing` finds when a ball passes a scoring gate: a sign
 * change of its signed distance to the gate's plane on a 1/240 s grid, closed
 * by bisection, counting only where the crossing lies inside the gate (a disc
 * by its radius, a rectangle by its half sizes).
 *
 * A disc gate of 0.25 m radius stands at (0, 1, 1) facing +Z; a rectangle 0.5
 * by 0.3 m half sizes stands at the same place.
 *
 * Scenarios:
 *
 * 1. A ball on the axis crosses the disc at 0.5 s, at its centre.
 * 2. One 0.3 m aside misses the disc but passes the rectangle.
 * 3. A window that ends before the crossing sees none; an empty window is a
 *    caller's defect and throws.
 */
export function test_unit_motions_sport_human_ball_play(): void {
  const disc: IAutoMovieMotionHumanBallPlay.Gate = {
    kind: "disc",
    centre: { x: 0, y: 1, z: 1 },
    normal: { x: 0, y: 0, z: 1 },
    radius: 0.25,
  };
  const rectangle: IAutoMovieMotionHumanBallPlay.Gate = {
    kind: "rectangle",
    centre: { x: 0, y: 1, z: 1 },
    normal: { x: 0, y: 0, z: 1 },
    up: { x: 0, y: 1, z: 0 },
    halfWidth: 0.5,
    halfHeight: 0.3,
  };
  const scored: IAutoMovieMotionHumanBallPlay.ICrossing | undefined =
    HumanBallPlay.crossing(flying(0), "ball", disc, 0, 1);
  TestValidator.predicate(
    "through the disc's centre",
    scored !== undefined &&
      nclose(scored.seconds, 0.5, BISECTION + 1e-12) &&
      vclose(scored.point, { x: 0, y: 1, z: 1 }, 2 * 2 * BISECTION + 1e-12),
  );
  TestValidator.predicate(
    "beside the disc, inside the rectangle",
    HumanBallPlay.crossing(flying(0.3), "ball", disc, 0, 1) === undefined &&
      HumanBallPlay.crossing(flying(0.3), "ball", rectangle, 0, 1) !==
        undefined,
  );
  TestValidator.predicate(
    "too soon, or no window",
    HumanBallPlay.crossing(flying(0), "ball", disc, 0, 0.4) === undefined &&
      throwsError(() => HumanBallPlay.crossing(flying(0), "ball", disc, 1, 1)),
  );
}
