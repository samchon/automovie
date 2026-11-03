import { assertHumanCurveKinks } from "../../../../internal/curves/assertHumanCurveKinks";
import { HumanCurveKinkRegions } from "../../../../internal/curves/HumanCurveKinkRegions";

/**
 * Pins that no person's temples or sides of the face carry a groove, step or
 * cliff between the eye and the ear: every vertical meridian behind the
 * lateral canthus turns no sharper than smooth skin does.
 *
 * Scenarios:
 * 1. A Gaussian ring 3 mm high and 2 mm wide raised round the head's vertical axis 10 mm above the eyes on a copy of f1's skin reads past the bound, at least 1.5 mm above the unedited skin.
 * 2. Every person of `HumanPeople`: both temples are read at five azimuths each, and every one past the bound is listed by person, azimuth, height and point.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person's bind skin and cuts the head chains by vertical half-planes through an axis 15 mm behind the eye centres' depth at their height, at 80 to 120 and 240 to 280 degrees of azimuth (the two temples), from 25 mm below to 45 mm above the eyes, reading each outline's sharpest turn over a 10 mm chord at 1 mm resampling. It catches the eye-to-ear groove, a horizontal step at the seam between the head's chains, the temple's cliff where its half breadth changes within a few millimetres of height, and a dent at the zygomatic arch.
 * @evidence contracts/testing.md#independent-expectations The bound is the crease definition (`HumanAnatomyShared.CREASE`): the temple, the zygomatic arch and the side of the face from the lateral orbital rim to the ear carry no crease in a young adult (Gray 1918), so any turn tighter than about 7 mm of radius there is a defect; the azimuths pass behind the lids and in front of the ear's root, and the ear's own chains are not read. Proven red on f1 by a 3 mm, 2 mm-wide Gaussian ring, 2.87 mm of sagitta over the chord. Oracle limits: the eye centres come from the rig; crow's feet with age are not modelled (`wrinkles` acts on the material).
 * @evidence contracts/testing.md#distinguishing-cases The core set's ten people, narrow and broad heads of both sexes. The face's landmarks and proportions belong to `test_human_anatomy_head`; the head chains' own curve soundness to `test_human_curve_head`.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_curves_dent_temple`, generating each person's bind skin in process on the CPU with no renderer, browser or GPU.
 */
export function test_human_curves_dent_temple(): void {
  assertHumanCurveKinks(HumanCurveKinkRegions.TEMPLE);
}
