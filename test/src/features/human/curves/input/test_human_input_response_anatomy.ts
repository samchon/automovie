import { HumanInputResponse } from "../../../internal/HumanInputResponse";
import { HumanInputResponseShards } from "../../../internal/HumanInputResponseShards";

/**
 * The selected glutealFurrowHeight input moves the generated skin's fold
 * reading by its own change, and no held tape with it.
 *
 * Scenarios:
 * 1. f1 with `glutealFurrowHeight` raised 20 mm over its resolved value: the gluteal fold read on both legs' skin rises 20 mm within 10 mm, and the thigh, knee and calf tapes read at their sites hold within their errors.
 * 2. Every input's status is printed and every non-honoured one is listed in the failure.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates f1 and a copy with one anatomy input changed, reads both skins by the leg observer's tape sites and by `HumanAnatomyLegFold.height`, the posterior profile's notch in the sagittal plane through each hip joint where the buttock's curve meets the thigh's, the fold ISO 8559-1 and ANSUR II start the thigh girth from. It catches an input the construction ignores, an input read at the wrong site, and an input that drags a held tape.
 * @evidence contracts/testing.md#independent-expectations Human `SKILL.md`'s Done When: every public parameter changes the figure, answered at its published site. The change is twice the crotch height's ANSUR II allowable error and the reading's tolerance is that error (10 mm), so a fold that does not move misses by 10 mm more than its tolerance. The fixture is f1; notch visibility for other proportions is not established by this shard. Proven red by judging the same base readings on both sides (`HumanInputResponse.assert`): an unmoved reading fails by the change less its tolerance. Oracle limits: a notch shallower than `HumanAnatomyLegFold.SMOOTH` reads as the crotch height.
 * @evidence contracts/testing.md#distinguishing-cases This shard moves only glutealFurrowHeight; held thigh, knee and calf readings are its negative controls. It does not establish responses of the other anatomy fields. Other response shards own their explicitly listed inputs; default admission belongs to `test_human_input_anatomy_defaults`.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_input_response_anatomy`, generating f1 and one changed person in process on the CPU, with no renderer, browser or GPU.
 */
export function test_human_input_response_anatomy(): void {
  HumanInputResponse.assert("anatomy", HumanInputResponseShards.SHARDS.anatomy.perturbations, HumanInputResponseShards.SHARDS.anatomy.groups);
}
