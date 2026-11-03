import { assertHumanCurveKinks } from "../../../../internal/curves/assertHumanCurveKinks";
import { HumanCurveKinkRegions } from "../../../../internal/curves/HumanCurveKinkRegions";

/**
 * Pins that no person's forehead carries a plateau edge, step or groove:
 * every frontal meridian from 30 to 80 mm above the eyes turns no sharper
 * than smooth skin does.
 *
 * Scenarios:
 * 1. A Gaussian ring 3 mm high and 2 mm wide raised round the head's vertical axis 55 mm above the eyes on a copy of f1's skin reads past the bound, at least 1.5 mm above the unedited skin.
 * 2. Every person of `HumanPeople`: seven frontal azimuths are read, and every one past the bound is listed by person, azimuth, height and point.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person's bind skin and cuts the middle and upper head chains by vertical half-planes through the head joint's vertical at the eyes' height, every 10 degrees from -30 to 30 degrees of azimuth, from 30 to 80 mm above the eyes, reading each outline's sharpest turn over a 10 mm chord at 1 mm resampling. It catches a plateau on the forehead, a step at a layer or at the seam between the middle and upper head chains, and a groove across the brow's top.
 * @evidence contracts/testing.md#independent-expectations The bound is the crease definition (`HumanAnatomyShared.CREASE`): above the superciliary arches the frontal bone's squama is smoothly convex under thin skin (Gray 1918), and transverse forehead lines are wrinkles the skin's material carries, not geometry; the brow ridge and glabella below 30 mm are not read. Proven red on f1 by a 3 mm, 2 mm-wide Gaussian ring. Oracle limits: the eye centres and head joint come from the rig; a forehead shorter than 80 mm above the eyes reads part of the scalp, which is as smooth.
 * @evidence contracts/testing.md#distinguishing-cases The core set's ten people, high and low foreheads of both sexes. The median profile's sign runs belong to the head profile rules (PRO-HD-1); this test owns the forehead's freedom from kinks.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_curves_dent_forehead`, generating the cached people's bind skin in process on the CPU with no renderer, browser or GPU.
 */
export function test_human_curves_dent_forehead(): void {
  assertHumanCurveKinks(HumanCurveKinkRegions.FOREHEAD);
}
