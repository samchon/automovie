import { assertHumanCurveKinks } from "../../../../internal/curves/assertHumanCurveKinks";
import { HumanCurveKinkRegions } from "../../../../internal/curves/HumanCurveKinkRegions";

/**
 * Pins that no person's skin carries a step, rim or collar where the neck
 * meets the shoulders: every lateral and posterior meridian of the neck's
 * base turns no sharper than smooth skin does.
 *
 * Scenarios:
 * 1. A Gaussian ring 3 mm high and 2 mm wide raised round the neck's axis on a copy of f1's skin reads past the bound, at least 1.5 mm above the unedited skin.
 * 2. Every person of `HumanPeople`: every azimuth from 60 to 300 degrees is read, and every one past the bound is listed by person, azimuth, station and point.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person's bind skin and cuts it by half-planes through the neck's axis (the neck joint to the head joint) every 15 degrees from 60 to 300 degrees of azimuth, from 0.04 S below the neck's base to 0.4 of the way to the head joint and within 0.09 S of the axis, so the trapezius' slope onto the shoulders is read with the neck. Each outline is resampled at 1 mm and read for its sharpest turn: the sagitta over a 10 mm chord less the 1.04 mm a 12.5 mm radius gives, and whether it bulges outward (a rim) or inward (a groove). It catches the flared disc and the stepped collar at the neck's base, a shelf where the shoulder line meets the neck, and any groove round the neck, named by azimuth and height.
 * @evidence contracts/testing.md#independent-expectations The bound is the catalog's crease definition, `HumanAnatomyShared.CREASE` (1 mm past the 12.5 mm radius' sagitta over a 10 mm chord, a turn tighter than about 7 mm of radius): the neck's base joins the trapezius and the deltoid's slope in a broad concave turn, with no crease there in anatomy (Gray 1918); the front third, where the jugular notch, the clavicles' heads and the sternocleidomastoid tendons make real small turns, is not read. No reference shape or construction constant enters. Proven red on f1: the made ring's sagitta at its crest is `3 (1 - exp(-25 / 8))` = 2.87 mm over the chord. Oracle limits: the axis comes from the rig's neck and head joints; a defect in the front third is left to the face and neck rows; a step gentler than a 7 mm radius passes.
 * @evidence contracts/testing.md#distinguishing-cases The core set's ten people, thin and heavy necks of both sexes, read at 17 azimuths each. The neck's girth profile and its creases up to the jaw belong to `test_human_anatomy_trunk`; the declared continuity of the layers to `test_human_layer_composition`; this test owns the turn of the skin across the neck's base and the shoulders' slope.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_curves_step_neck_base`, generating the cached people's bind skin in process on the CPU with no renderer, browser or GPU.
 */
export function test_human_curves_step_neck_base(): void {
  assertHumanCurveKinks(HumanCurveKinkRegions.NECK_BASE);
}
