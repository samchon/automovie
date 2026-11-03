import { assertHumanCurveKinks } from "../../../../internal/curves/assertHumanCurveKinks";
import { HumanCurveKinkRegions } from "../../../../internal/curves/HumanCurveKinkRegions";

/**
 * Pins that a lean person's abdomen, flanks and back carry no fold: every
 * vertical meridian there turns no sharper than smooth skin does, on every
 * person whose own inputs make them lean.
 *
 * Scenarios:
 * 1. A Gaussian ring 3 mm high and 2 mm wide raised round the trunk's vertical axis at mid-abdomen, and again at mid-back, on a copy of f1's skin reads past the bound, at least 1.5 mm above the unedited skin.
 * 2. Every lean person of `HumanPeople` (waist over stature under 0.5 and `fat` at or below zero): the abdomen's and the back's side meridians are read, and every one past the bound is listed by person, azimuth, height and point.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each lean person's bind skin and cuts the trunk by vertical half-planes through the spine joint's vertical, at the front flanks (15 to 70 degrees either side of forward) from 0.50 S to 0.62 S of height and at the back's sides (110 to 165 degrees either side) from 0.55 S to 0.72 S, reading each outline's sharpest turn over a 10 mm chord at 1 mm resampling. It catches an abdominal roll, a lateral waist roll and a back roll at the bra line on a person whose inputs make them lean.
 * @evidence contracts/testing.md#independent-expectations Leanness is read from the person's own inputs: a waist over stature under 0.5, the adult boundary of central adiposity for both sexes (Ashwell 2012; Browning 2010; source notes owed, catalog section 6), with the unitless `fat` control at or below zero; adiposity folds form where subcutaneous fat overhangs, so a lean trunk shows none, while its anatomical creases (the umbilicus, the spinal furrow) lie on the midline the azimuths leave out. The bound is the crease definition (`HumanAnatomyShared.CREASE`). Proven red on f1 (waist over stature 0.397, `fat` -0.65) by a 3 mm, 2 mm-wide Gaussian ring in each region. Oracle limits: a person who is not lean is not read here (FLD-5 bounds a fold by its overhang); the spine joint places the axis.
 * @evidence contracts/testing.md#distinguishing-cases The lean people of the core set, both sexes; heavier people are left to the overhang rule. The trunk's outlines belong to `test_human_curves_profile_trunk`, its girth profile to the trunk rules.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_curves_fold_lean`, generating the cached people's bind skin in process on the CPU with no renderer, browser or GPU.
 */
export function test_human_curves_fold_lean(): void {
  const failures: string[] = [];
  for (const region of [HumanCurveKinkRegions.ABDOMEN, HumanCurveKinkRegions.BACK]) {
    try {
      assertHumanCurveKinks(region);
    } catch (error) {
      failures.push((error as Error).message);
    }
  }
  if (failures.length !== 0) throw new Error(failures.join("\n"));
}
