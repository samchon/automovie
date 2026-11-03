import { HumanInputResponse } from "../../../internal/HumanInputResponse";
import { HumanInputResponseShards } from "../../../internal/HumanInputResponseShards";

/**
 * Every anatomical body input (`params.body.anatomy`) moves the generated
 * skin at its own published site by its own change, and no held tape with it.
 *
 * Scenarios:
 * 1. f1 with `glutealFurrowHeight` raised 20 mm over its resolved value: the gluteal fold read on both legs' skin rises 20 mm within 10 mm, and the thigh, knee and calf tapes read at their sites hold within their errors.
 * 2. Every input's status is printed and every non-honoured one is listed in the failure.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates f1 and a copy with one anatomy input changed, reads both skins by the leg observer's tape sites and by `HumanAnatomyLegFold.height`, the posterior profile's notch in the sagittal plane through each hip joint where the buttock's curve meets the thigh's, the fold ISO 8559-1 and ANSUR II start the thigh girth from. It catches an input the construction ignores, an input read at the wrong site, and an input that drags a held tape.
 * @evidence contracts/testing.md#independent-expectations Human `SKILL.md`'s Done When: every public parameter changes the figure, answered at its published site. The change is twice the crotch height's ANSUR II allowable error and the reading's tolerance is that error (10 mm), so a fold that does not move misses by 10 mm more than its tolerance. f1 because its fold stands clear of the crotch ring; on m2 the fold lies 16 mm under the crotch, where the crotch ring carries the thigh tape. Proven red the way every response shard is: an unmoved reading fails by the change less its tolerance (`HumanInputResponse.assert`). Oracle limits: a notch shallower than `HumanAnatomyLegFold.SMOOTH` reads as the crotch height.
 * @evidence contracts/testing.md#distinguishing-cases Each anatomy input moves alone; the held tapes are the negative case. The anatomy inputs still being wired (knee, ankle, bimalleolar, elbow, wrist, heel and thumb breadths, the shoulder points, chest breadth, cervicale height, body fat) join this shard with their sites as their modelers land them; their defaults belong to `test_human_input_anatomy_defaults`.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_input_response_anatomy`, generating f1 and one changed person in process on the CPU, with no renderer, browser or GPU.
 */
export function test_human_input_response_anatomy(): void {
  HumanInputResponse.assert("anatomy", HumanInputResponseShards.SHARDS.anatomy.perturbations, HumanInputResponseShards.SHARDS.anatomy.groups);
}
