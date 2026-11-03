import { HumanInputResponse } from "../../../internal/HumanInputResponse";
import { HumanInputResponseShards } from "../../../internal/HumanInputResponseShards";

/**
 * Every eye, nose, mouth and ear input moves the generated face at its own
 * landmarks by its own change, on its own side, and no other input's reading
 * with it.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates f1 and, for each of intercanthal width, the left palpebral fissure's length and height, nasal width, height and protrusion, mouth width, the upper and lower vermilion heights and the left ear's length, breadth and protrusion, a copy with that one input raised by 3 mm, three head errors, and reads every face and head dimension on both skins with `HumanAnatomyHead.faceSites`. An input passes when its own reading moves by 3 mm within 1 mm and every held reading, the right eye's and right ear's among them, moves less than its own error. Every input's status is printed and every non-honoured one is listed in the failure. It catches an input ignored, one moved to the other side or another landmark, and a fissure or auricle the change destroys.
 * @evidence contracts/testing.md#independent-expectations The expected change is the edit itself, each input being a Farkas distance between its own landmarks; the tolerance is ISO 20685-1:2018's 1 mm for head dimensions without hair, the head audit's. No construction constant enters. Oracle limits: one base person; the difference cancels a landmark's convention offset.
 * On f1 on 2026-11-03 intercanthal width, fissure length, mouth width and upper vermilion are honoured; the fissure height and nasal height move al-al 1.4 and 1.3 mm, nasal width moves its own reading 1.8 of 3 mm, nasal protrusion moves al-al 13 mm, the lower vermilion does not move, ear length moves its reading 0.7 of 3 mm with ch-ch and the ear's protrusion, ear breadth moves the protrusion -1.9 mm and ear protrusion moves its own reading -4.3 for +3 mm.
 * @evidence contracts/testing.md#distinguishing-cases Paired inputs move on the left only, so the right side's identical reading is the negative case that catches a change routed to both sides or the wrong one. Absolute identity belongs to `test_human_anatomy_head`; cranial inputs to `test_human_input_response_head`.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_input_response_face`, generating f1 and twelve perturbed people in process on the CPU, with no renderer, browser or GPU.
 */
export function test_human_input_response_face(): void {
  HumanInputResponse.assert("face", HumanInputResponseShards.SHARDS.face.perturbations, HumanInputResponseShards.SHARDS.face.groups);
}
