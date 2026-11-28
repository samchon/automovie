import { AutoMovieEngineGravity } from "@automovie/engine";
import type { IAutoMovieMotionHumanSkydive } from "@automovie/interface";
import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import {
  skydivePath
} from "../../../../../packages/motions/src/airborne/internal/skydivePath";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Rounding of a few hyperbolic products, metres, seconds and degrees. */
const ROUNDING: number = 1e-6;

/** The freefall's terminal speed the path falls toward, m/s. */
const TERMINAL: number = 53;

/**
 * Check canopy descent timing and the path through successive turns.
 *
 * Scenarios:
 *
 * 1. Start 3000 m up and deploy at 1000 m. Check the drag-law deployment
 *    time, ground touchdown and +X landing velocity of 2 m/s.
 * 2. Apply a three-second left toggle ten seconds after opening. Read the
 *    intermediate heading and the resulting quarter arc, then forward travel
 *    and the next right arc.
 * 3. Refuse a deployment above exit, insufficient canopy height and
 *    overlapping toggles.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases give the altitude budget, toggle timing and turn geometry.
 * @evidence contracts/development/testing.md#behavioral-verification The path owner receives configured phases and its position, heading and landing vector are sampled in each selected phase.
 * @evidence contracts/development/testing.md#independent-expectations Inverting the quadratic-drag drop gives the deployment time. Circular arc radius and prescribed forward speed give the horizontal endpoints.
 */
export function test_motions_airborne_skydive_path(): void {
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
  const g: number = AutoMovieEngineGravity.STANDARD;
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
      if (error instanceof AutoMovieMotionHumanRefusal) return error.axis;
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
  const arcs: skydivePath.IPath = skydivePath.prepare(
    {
      ...params,
      toggles: [{ at: 14, side: "right", hold: 3 }, ...params.toggles!],
    },
    { x: 0, y: 3000, z: 0 },
    0,
    0,
  );
  const radius: number = 60 / Math.PI;
  const first: skydivePath.IAt = arcs.at(arcs.open + 10);
  const second: skydivePath.IAt = arcs.at(arcs.open + 14);
  const turned: skydivePath.IAt = arcs.at(arcs.open + 17);
  TestValidator.predicate(
    "the second arc starts at the first arc's endpoint plus the straight segment",
    nclose(second.hips.x - first.hips.x, radius + 10, ROUNDING) &&
      nclose(second.hips.z - first.hips.z, radius, ROUNDING) &&
      nclose(turned.hips.x - second.hips.x, radius, ROUNDING) &&
      nclose(turned.hips.z - second.hips.z, radius, ROUNDING) &&
      nclose(arcs.at(arcs.open + 11.5).heading, 45, ROUNDING) &&
      nclose(turned.heading, 0, ROUNDING) &&
      nclose(arcs.at(arcs.open + 14).hips.x, second.hips.x, ROUNDING),
  );
}
