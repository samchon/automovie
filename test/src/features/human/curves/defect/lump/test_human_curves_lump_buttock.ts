import { assertHumanCurveKinks } from "../../../../internal/curves/assertHumanCurveKinks";
import { HumanCurveKinkRegions } from "../../../../internal/curves/HumanCurveKinkRegions";

/**
 * Pins that no person's buttock carries a lump behind it: every posterior
 * meridian of each buttock, from above the gluteal fold to below the iliac
 * crest, turns no sharper than smooth skin does, on both sides.
 *
 * Scenarios:
 * 1. A Gaussian ring 3 mm high and 2 mm wide raised round the region's axis on a copy of f1's skin reads past the bound, at least 1.5 mm above the unedited skin.
 * 2. Every person of `HumanPeople`: both buttocks' posterior meridians are read, and every one past the bound is listed by person, side, azimuth, station and point.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person's bind skin and cuts each buttock by vertical half-planes through its hip joint every 10 degrees from 160 to 200 degrees of azimuth (straight back), from 0.04 S below the hip joint to 0.08 S above it, within 0.12 S of the axis, reading each outline's sharpest turn over a 10 mm chord at 1 mm resampling. It catches the lump behind the buttocks that the 02:50 side frames of f2 show, a ledge where the gluteal relief's window ends on the trunk, and a step where the trunk's rows meet the leg's root behind.
 * @evidence contracts/testing.md#independent-expectations The bound is the crease definition (`HumanAnatomyShared.CREASE`): gluteus maximus and its fat pad form one convex mass from the iliac crest and sacrum to the gluteal fold (Gray 1918); the fold below the window and the natal cleft medial of it are real creases and are not read. Proven red on f1 by a 3 mm, 2 mm-wide Gaussian ring, 2.87 mm of sagitta over the chord. Oracle limits: a lump broader than the chord with no turn of small radius reads as smooth here; the side profile's single buttock maximum belongs to `test_human_curves_profile_trunk`; the bind's A-pose is read.
 * @evidence contracts/testing.md#distinguishing-cases Both buttocks of the core set's ten people, flat and full buttocks of both sexes. The hip girth belongs to `test_human_anatomy_trunk`, the sides of the hips to `test_human_curves_dent_hip`, the thigh root to `test_human_curves_step_groin`.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_curves_lump_buttock`, generating each person's bind skin in process on the CPU with no renderer, browser or GPU.
 */
export function test_human_curves_lump_buttock(): void {
  const failures: string[] = [];
  for (const side of ["left", "right"] as const) {
    try {
      assertHumanCurveKinks(HumanCurveKinkRegions.buttock(side));
    } catch (error) {
      failures.push((error as Error).message);
    }
  }
  if (failures.length !== 0) throw new Error(failures.join("\n"));
}
