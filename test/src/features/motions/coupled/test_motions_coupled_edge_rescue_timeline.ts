import type { IAutoMovieVector3 } from "@automovie/interface";
import { edgeRescueScene } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/**
 * The distances are below 2 m and the timeline below 6 s. Sixty-four binary64
 * rounding units at this scale bound the arithmetic and square root.
 */
const ROUNDING: number = 64 * Number.EPSILON * 8;

/**
 * Prepare a fall, arrest and haul for an authored catch point.
 *
 * Scenarios:
 *
 * 1. A 0.65 m drop reaches the catch after sqrt(1.3/g) seconds. The missed outcome
 *    stops after arrest, while the caught outcome continues to kneel.
 * 2. The grip holds until the haul, then rises and travels behind the lip. At half
 *    time it has covered half the combined straight-line length.
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
