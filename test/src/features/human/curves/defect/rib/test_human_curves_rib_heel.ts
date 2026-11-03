import { assertHumanCurveKinks } from "../../../../internal/curves/assertHumanCurveKinks";
import { HumanCurveKinkRegions } from "../../../../internal/curves/HumanCurveKinkRegions";

/**
 * Pins that no person's heel carries ribs or a diagonal crease: every vertical
 * meridian of the heel's back and sides turns no sharper than smooth skin
 * does, on both feet.
 *
 * Scenarios:
 * 1. A Gaussian ring 3 mm high and 2 mm wide raised round each ankle's vertical 22 mm above the floor on a copy of f1's skin reads past the bound, at least 1.5 mm above the unedited skin.
 * 2. Every person of `HumanPeople`: both heels are read at 13 posterior azimuths each, and every one past the bound is listed by person, side, azimuth, height and point.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person's bind skin and cuts each foot chain by vertical half-planes through the ankle joint's vertical, every 10 degrees from 120 to 240 degrees of azimuth (the heel's back and sides), from 5 to 40 mm above the floor, reading each outline's sharpest turn over a 10 mm chord at 1 mm resampling. It catches ribs printed across the heel by the foot's sections and the diagonal crease seen at the heel.
 * @evidence contracts/testing.md#independent-expectations The bound is the crease definition (`HumanAnatomyShared.CREASE`): the calcaneal tuberosity under the heel's fat pad makes one convex dome (Gray 1918), with no crease standing below the hollows beside the Achilles tendon, which lie above 40 mm and are not read. Proven red on f1 by a 3 mm, 2 mm-wide Gaussian ring. Oracle limits: the ankle joint's vertical places the axis; the sole's contact below 5 mm is the foot audit's.
 * @evidence contracts/testing.md#distinguishing-cases Both feet of the core set's ten people, small and large feet of both sexes. The foot's length, breadth and floor contact belong to `test_human_anatomy_foot`, the foot chain's longitudinal ribs to `test_human_curve_foot`, the foot's pieces to the part tester.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_curves_rib_heel`, generating the cached people's bind skin in process on the CPU with no renderer, browser or GPU.
 */
export function test_human_curves_rib_heel(): void {
  const failures: string[] = [];
  for (const side of ["left", "right"] as const) {
    try {
      assertHumanCurveKinks(HumanCurveKinkRegions.heel(side));
    } catch (error) {
      failures.push((error as Error).message);
    }
  }
  if (failures.length !== 0) throw new Error(failures.join("\n"));
}
