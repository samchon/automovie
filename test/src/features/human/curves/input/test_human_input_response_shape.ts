import { HumanInputResponse } from "../../../internal/HumanInputResponse";
import { HumanInputResponseShards } from "../../../internal/HumanInputResponseShards";

/**
 * Stature moves the generated crown by its own change with every tape held,
 * the shape coordinates change the figure without moving a held tape, and
 * every other body input changes the figure at all.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates f1 and a copy with one input changed: stature raised 18 mm; fat, muscularity raised and masculineFeminine lowered by 0.3; a complete supplement supplied; every independent measurement set 3 percent above its control; the two height diagnostics set. Both skins are read by the trunk, course, arm, leg and head observers and the skin's highest point. Stature passes when the highest point rises 18 mm within 6 mm and every tape, length and head dimension, all held, moves less than its error; an input without a site (the three coordinates, the supplement, the measurements, the diagnostics) passes when the figure changes at all and fails, listed as ignored, when the generated skin is identical vertex for vertex. Every input's status is printed and every non-honoured one is listed in the failure.
 * @evidence contracts/testing.md#independent-expectations Human `SKILL.md`'s Done When: "Every public parameter changes the figure through that construction, answered at its published site"; an input whose change leaves every vertex where it was is read by no construction. The shape coordinates are unitless coordinates of the reference source's authoring model (`IAutoMovieHumanBodyControls`) with no anthropometric definition, so only their change of the figure is asserted, and their held tapes must stay. Stature's tolerance is ANSUR II's 6 mm (`ansur-ii-course-measures.md`). No construction constant enters. Oracle limits: "changes the figure" accepts any change, so a misrouted coordinate passes as long as it moves something; the held tapes catch a coordinate that moves a tape it must not.
 * On f1 on 2026-11-03 fat, masculineFeminine and muscularity change the figure with every tape held; stature moves the crown 18 mm but the held neck-to-waist 6.4 mm; the supplement, the measurements and the diagnostics leave every vertex where it was, read by no construction.
 * @evidence contracts/testing.md#distinguishing-cases Each input moves alone; the held tapes are the negative case. Region inputs belong to the other `test_human_input_response_*` shards; appearance, pigmentation, pose and expression inputs to the subsystem and pose tests.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_input_response_shape`, generating f1 and seven changed people in process on the CPU, with no renderer, browser or GPU.
 */
export function test_human_input_response_shape(): void {
  HumanInputResponse.assert("shape", HumanInputResponseShards.SHARDS.shape.perturbations, HumanInputResponseShards.SHARDS.shape.groups);
}
