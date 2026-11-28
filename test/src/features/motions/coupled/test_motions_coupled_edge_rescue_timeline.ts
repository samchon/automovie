import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  edgeRescueScene
} from "../../../../../packages/motions/src/coupled/internal/edgeRescueScene";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/**
 * The distances are below 2 m and the timeline below 6 s. Sixty-four binary64
 * rounding units at this scale bound the arithmetic and square root.
 */
const ROUNDING: number = 64 * Number.EPSILON * 8;

/**
 * Check the fall, arrest and haul allocated to an edge rescue.
 *
 * Scenarios:
 *
 * 1. A 0.65 m free drop reaches the catch after sqrt(1.3 / g) s. The missed
 *    branch ends after arrest and the caught branch continues through haul
 *    and kneel.
 * 2. Hold the same grip through arrest and follow the two straight haul
 *    segments. Mid-haul time covers half the combined length.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases specify both authored outcomes, cue times and the piecewise grip path.
 * @evidence contracts/development/testing.md#behavioral-verification The timeline function is exercised with explicit grip geometry and both outcome flags.
 * @evidence contracts/development/testing.md#independent-expectations The ballistic equation determines fall time. The authored hold and haul lengths fix cue offsets and straight-segment distance shares.
 */
export function test_motions_coupled_edge_rescue_timeline(): void {
  const lip: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const grip: IAutoMovieVector3 = { x: 0, y: 0.35, z: 0.25 };
  const props: edgeRescueScene.ITimeline = {
    lip,
    grip,
    reach: 0.25,
    out: { x: 0, y: 0, z: 1 },
    along: { x: 1, y: 0, z: 0 },
    hold: 1,
    holds: true,
  };
  const caught: edgeRescueScene.IScene = edgeRescueScene.timeline(props);
  const missed: edgeRescueScene.IScene = edgeRescueScene.timeline({
    ...props,
    holds: false,
  });
  const flight: number = Math.sqrt(1.3 / 9.80665);
  TestValidator.predicate(
    "only a successful catch reaches the kneeling branch",
    nclose(caught.caught, 1 + flight, ROUNDING) &&
      nclose(caught.haul, 1.3 + flight, ROUNDING) &&
      nclose(caught.kneel, 3.3 + flight, ROUNDING) &&
      nclose(caught.end, 4.5 + flight, ROUNDING) &&
      nclose(missed.end, 1.3 + flight, ROUNDING),
  );
  TestValidator.predicate(
    "the haul traverses one metre up and three-quarter metres back",
    vclose(caught.gripAt(caught.caught), grip, ROUNDING) &&
      vclose(caught.gripAt(caught.haul), grip, ROUNDING) &&
      vclose(
        caught.gripAt(caught.haul + 1),
        { x: 0, y: 1.225, z: 0.25 },
        ROUNDING,
      ) &&
      vclose(
        caught.gripAt(caught.kneel),
        { x: 0, y: 1.35, z: -0.5 },
        ROUNDING,
      ) &&
      vclose(caught.gripAt(caught.end), { x: 0, y: 1.35, z: -0.5 }, ROUNDING),
  );
}
