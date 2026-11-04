import { HumanInputResponse } from "../../../internal/HumanInputResponse";
import { HumanInputResponseShards } from "../../../internal/HumanInputResponseShards";

/**
 * Every hand and foot input moves the generated hand or foot at its own site
 * by its own change, on its own side, and no other input's reading with it.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates f1 and, for each of the left hand's length, breadth, palm length and thumb length, the hand circumference control, and the left foot's length and breadth, a copy with that one input raised by three times its reading's allowable error, poses both skins to the anatomical neutral by the rig's dual-quaternion blend (as `HumanAnatomy.posed` does) and reads them with the hand and foot audits' locators (`HumanAnatomyHand.handSites`, `HumanAnatomyFoot.footSites`) and the arm audit's tapes. An input passes when its own reading moves by the change within its error and every held reading, the right hand's and foot's among them, moves less than its own; the lateral malleolus height, which the foot audit cannot site, passes when the figure changes. Every input's status is printed and every non-honoured one is listed in the failure.
 * @evidence contracts/testing.md#independent-expectations The expected change is the edit itself. Tolerances are ISO 20685-1:2018's hand dimensions 1 mm, foot dimensions 2 mm and small circumferences 4 mm, the hand and foot audits'. No construction constant enters. Oracle limits: one base person; the neutral is posed by this test's own copy of the dual-quaternion blend for people no named person holds, the same arithmetic as `HumanAnatomy.posed`. Proven red by judging every perturbation as if it had moved nothing (`HumanInputResponse.assert`): each must come out not honoured.
 * On f1 on 2026-11-03 hand breadth, thumb length, hand circumference, foot length and foot breadth are honoured and the malleolus height changes the figure; hand length and palm length move the held hand breadth -1.1 and 1.3 mm against its 1 mm error.
 * @evidence contracts/testing.md#distinguishing-cases Paired inputs move on the left only, so the right side is the negative case; the hand circumference control is one for both hands and expects both to move. Absolute identity belongs to `test_human_anatomy_hand` and `test_human_anatomy_foot`.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_input_response_extremities`, generating and posing f1 and eight perturbed people in process on the CPU, with no renderer, browser or GPU.
 */
export function test_human_input_response_extremities(): void {
  HumanInputResponse.assert("extremities", HumanInputResponseShards.SHARDS.extremities.perturbations, HumanInputResponseShards.SHARDS.extremities.groups);
}
