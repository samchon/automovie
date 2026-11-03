import { HumanInputResponse } from "../../../internal/HumanInputResponse";
import { HumanInputResponseShards } from "../../../internal/HumanInputResponseShards";

/**
 * Every girth tape the construction honours answers a decrease as it
 * answers an increase: lowered by three of its allowable errors, its own
 * reading falls by that change and no other input's reading moves.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates f1 and, for each of chest, waist, hip, neck, bicep, wrist, knee and calf, a copy of f1 with that one control lowered by three times its reading's allowable error, and reads both skins with the region observers' own site locators (the trunk audit's tapes and neck girth, the arm audit's and the leg audit's tapes per side, the skin's highest point). It passes an input when its own reading falls by the change within that reading's allowable error and every reading of a held input moves less than its own error. It catches an input honoured upward only, one the construction clamps or saturates at its working point, and a decrease routed to another site, which the positive shards cannot see.
 * @evidence contracts/testing.md#independent-expectations The expected change is the edit itself, the controls being independent (`IAutoMovieHumanBodyControls`: "no control is inferred from another"); a measure defined at a site falls with its input as it rises with it. Tolerances are ISO 20685-1:2018's large and small circumferences (9 and 4 mm), the same the identity rows use. No construction constant or earlier output enters. Oracle limits: one base person; a change of three errors reads the response near f1's inputs only; a positive shard owns the same input's increase (catalog IR-1 to IR-20), so an input red in both directions is one finding, not two.
 * @evidence contracts/testing.md#distinguishing-cases Each input moves alone, every other held as the negative case. The increases belong to `test_human_input_response_trunk` and `test_human_input_response_limbs`, the identity at the absolute value to the anatomy tests.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_input_response_negative`, generating f1 and eight perturbed people in process on the CPU, with no renderer, browser or GPU.
 */
export function test_human_input_response_negative(): void {
  HumanInputResponse.assert("negative", HumanInputResponseShards.SHARDS.negative.perturbations, HumanInputResponseShards.SHARDS.negative.groups);
}
