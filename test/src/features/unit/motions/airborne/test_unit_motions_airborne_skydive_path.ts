import { AutoMovieGravity } from "@automovie/engine";
import type { IAutoMovieMotionHumanSkydive } from "@automovie/interface";
import { HumanRefusal, skydivePath } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of a few hyperbolic products, metres, seconds and degrees. */
const ROUNDING: number = 1e-6;

/** The freefall's terminal speed the path falls toward, m/s. */
const TERMINAL: number = 53;

/**
 * `skydivePath` is a parachute jump's hips path, phase by phase in closed form:
 * the freefall with quadratic drag toward terminal speed (`drop = vt^2 / g ln
 * cosh(g t / vt)`), the canopy's opening, its constant sink and forward flight
 * with held toggles turning it, and the flare to touchdown.
 *
 * Scenarios, an exit 3000 m above the ground facing +Z, deploying at 1000 m:
 *
 * 1. The deployment comes when the freefall has dropped the 2000 m, at `vt / g
 *    acosh(exp(2000 g / vt^2))`; the hips start at the exit and touch down on
 *    the ground, every phase's drop summing to the 3000 m, landing at 2 m/s
 *    along the heading the toggle turned it to, +X.
 * 2. Ten seconds into the canopy flight a 3 s left toggle starts, turning the
 *    heading 90 degrees by its end.
 * 3. A deployment above the exit, one too low for the canopy to open and slow
 *    before the flare, and overlapping toggles are refused.
 */
export function test_unit_motions_airborne_skydive_path(): void {
  const params: IAutoMovieMotionHumanSkydive.IParams = {
    from: "plane",
    edge: "door",
    deploy: 1000,
    toggles: [{ at: 10, side: "left", hold: 3 }],
  };
  const path: skydivePath.IPath = skydivePath.prepare(
    params,
    { x: 0, y: 3000, z: 0 },
    0,
    0,
  );
  const g: number = AutoMovieGravity.STANDARD;
  const deploy: number =
    (TERMINAL / g) * Math.acosh(Math.exp((2000 * g) / TERMINAL ** 2));
  TestValidator.predicate(
    "the fall",
    nclose(path.deploy, deploy, ROUNDING) &&
      nclose(path.at(0).hips.y, 3000, ROUNDING) &&
      path.at(0).phase === "freefall" &&
      nclose(path.at(path.touchdown).hips.y, 0, ROUNDING) &&
      path.at(path.touchdown).phase === "flare" &&
      nclose(path.landing.x, 2, ROUNDING) &&
      nclose(path.landing.z, 0, ROUNDING),
  );
  TestValidator.predicate(
    "the toggle",
    nclose(path.at(path.open + 9).heading, 0, ROUNDING) &&
      nclose(path.at(path.open + 14).heading, 90, ROUNDING) &&
      path.at(path.open + 14).phase === "canopy",
  );
  const refused: (asked: IAutoMovieMotionHumanSkydive.IParams) => string = (
    asked: IAutoMovieMotionHumanSkydive.IParams,
  ): string => {
    try {
      skydivePath.prepare(asked, { x: 0, y: 3000, z: 0 }, 0, 0);
    } catch (error: unknown) {
      if (error instanceof HumanRefusal) return error.axis;
    }
    return "admitted";
  };
  TestValidator.equals(
    "refusals",
    [
      refused({ ...params, deploy: 3500 }),
      refused({ ...params, deploy: 50 }),
      refused({
        ...params,
        toggles: [
          { at: 10, side: "left", hold: 3 },
          { at: 12, side: "right", hold: 3 },
        ],
      }),
    ],
    ["deploy", "deploy", "toggles[1]"],
  );
}
