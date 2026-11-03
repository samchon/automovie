import { assertHumanCurveKinks } from "../../../../internal/curves/assertHumanCurveKinks";
import { HumanCurveKinkRegions } from "../../../../internal/curves/HumanCurveKinkRegions";

/**
 * Pins that no person's hips carry a dent on their sides: every lateral
 * vertical meridian from the trochanters' level to below the iliac crests
 * turns no sharper than smooth skin does.
 *
 * Scenarios:
 * 1. A Gaussian ring 3 mm high and 2 mm wide raised round the body's vertical axis at 0.55 S on a copy of f1's skin reads past the bound, at least 1.5 mm above the unedited skin.
 * 2. Every person of `HumanPeople`: both hips are read at five azimuths each, and every one past the bound is listed by person, azimuth, height and point.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person's bind skin and cuts the trunk and legs by vertical half-planes through the spine joint's depth, at 70 to 110 and 250 to 290 degrees of azimuth, from 0.50 S to 0.60 S of height, reading each outline's sharpest turn over a 10 mm chord at 1 mm resampling. It catches the hip dents the viewer frames show, a step where the trunk's rows meet the legs' roots on the side, and a groove along the iliac wing.
 * @evidence contracts/testing.md#independent-expectations The bound is the crease definition (`HumanAnatomyShared.CREASE`): gluteus medius and tensor fasciae latae cover the iliac wing and the greater trochanter in one convex run (Gray 1918); the lateral fold of adiposity above the iliac crest lies above 0.60 S and is the lean-fold rule's (`test_human_curves_fold_lean`). Proven red on f1 by a 3 mm, 2 mm-wide Gaussian ring, 2.87 mm of sagitta over the chord. Oracle limits: the trochanteric hollow behind the trochanter of a muscular person is a broad concavity of large radius, which the bound admits; the bind's A-pose is read.
 * @evidence contracts/testing.md#distinguishing-cases The core set's ten people, narrow and broad hips of both sexes. The hip girth at its site belongs to `test_human_anatomy_trunk`, the trunk's side outline to `test_human_curves_profile_trunk`.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_curves_dent_hip`, generating each person's bind skin in process on the CPU with no renderer, browser or GPU.
 */
export function test_human_curves_dent_hip(): void {
  assertHumanCurveKinks(HumanCurveKinkRegions.HIP);
}
