import { HumanInputResponse } from "../../../internal/HumanInputResponse";
import { HumanInputResponseShards } from "../../../internal/HumanInputResponseShards";

/**
 * Every arm and leg input moves the generated skin at its own site by its own
 * change, and no other input's reading with it.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates f1 and, for each of upperArmLength, lowerArmLength, bicep, elbow, forearm, wrist, inseam, thigh, knee and calf, a copy of f1 with that one control raised by three times its reading's allowable error (inseam by 30 mm), and reads both skins with the region observers' own site locators: the arm audit's upper arm, elbow, forearm and stylion tapes per side, the leg audit's thigh, mid-patella and calf tapes per side, the course observer's ANSUR II acromion-radiale and radiale-stylion lengths per side and its crotch height (ISO 8559-1 5.7.6 inside leg length plus the held malleolus height), the trunk audit's tapes and the skin's highest point. An input passes when its own readings, on both sides, move by the change within their allowable errors and every reading of a held input moves less than its own; every input's status is printed and every non-honoured one is listed in the failure. It catches an input the construction ignores, one it routes to another site or by another amount, and a site the change destroys.
 * @evidence contracts/testing.md#independent-expectations The expected change is the edit itself, the controls being independent (`IAutoMovieHumanBodyControls`). Tolerances: ISO 20685-1:2018 small and large circumferences (4 and 9 mm), ANSUR II's acromion-radiale 4 mm, radiale-stylion 6 mm and crotch height 10 mm (`ansur-ii-course-measures.md`). No construction constant enters. Oracle limits: the radiale and stylion levels are the rig's elbow and wrist joints (the skin carries no radial head a test can find), so a length's response reads where the construction puts the joint as much as the skin; the difference of two readings cancels the convention offset of each input's course; one base person.
 * @evidence contracts/testing.md#distinguishing-cases Each input moves alone, every other held as the negative case; both sides of every paired reading are expected to move, as each control is one for both sides. Identity at the absolute value belongs to `test_human_anatomy_arm`, `test_human_anatomy_leg` and `test_human_anatomy_course`; other inputs to the other shards.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_input_response_limbs`, generating f1 and ten perturbed people in process on the CPU, with no renderer, browser or GPU.
 */
export function test_human_input_response_limbs(): void {
  HumanInputResponse.assert("limbs", HumanInputResponseShards.SHARDS.limbs.perturbations, HumanInputResponseShards.SHARDS.limbs.groups);
}
