import { HumanInputResponse } from "../../../internal/HumanInputResponse";
import { HumanInputResponseShards } from "../../../internal/HumanInputResponseShards";

/**
 * Stature moves the generated crown by its own change with every tape held,
 * changing body fat percentage changes the figure. The siteless fat case
 * does not establish that held tape readings remain unchanged.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates f1 and two independent copies: stature raised 18 mm and body fat percentage raised 5 points. The stature case reads both skins with the trunk, course, arm, leg and head observers and the skin's highest point; it passes when the highest point rises 18 mm within 6 mm and every held reading moves less than its error. The siteless fat case compares bind coordinates only, passing any changed figure and failing an identical skin as ignored; its perturbed observer readings are not taken. Every input's status is printed and every non-honoured one is listed in the failure.
 * @evidence contracts/testing.md#independent-expectations Human `SKILL.md` requires public parameters to change the figure through the construction, answered at their published sites. Body fat percentage is treated as siteless, so only a change of the figure is asserted. Stature's expected change is the literal 18 mm edit and its tolerance is ANSUR II's 6 mm (`ansur-ii-course-measures.md`); no construction constant enters. Oracle limits: the fat case accepts any changed vertex, including a misrouted change, and does not test held tape invariance; only the stature case compares those held readings. The unmoved-figure proof uses the same numeric base on both sides for stature and a false changed flag for the siteless fat case; neither may be judged honoured.
 * On f1 on 2026-11-03 stature moved the crown 18 mm but the held neck-to-waist 6.4 mm. The supplement, the independent measurements, the height diagnostics and the three shape coordinates (fat, masculineFeminine, muscularity) were removed from the input on 2026-11-04.
 * @evidence contracts/testing.md#distinguishing-cases Each input moves alone. Held readings are the stature case's negative controls; an unchanged figure is the fat case's negative proof. Region inputs belong to the other `test_human_input_response_*` shards, the anatomy inputs to `test_human_input_response_anatomy`; appearance, pigmentation, pose and expression inputs are outside this shard.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_input_response_shape`, generating f1 and two changed people in process on the CPU, with no renderer, browser or GPU.
 */
export function test_human_input_response_shape(): void {
  HumanInputResponse.assert("shape", HumanInputResponseShards.SHARDS.shape.perturbations, HumanInputResponseShards.SHARDS.shape.groups);
}
