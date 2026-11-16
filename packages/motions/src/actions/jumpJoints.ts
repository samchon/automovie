import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { stand } from "./stand";

/**
 * The jump's relaxed hands, upright trunk and arm swing at their authored
 * flexions. Push, flight and their endpoint readers use this same table.
 *
 * @param body The actual body whose resting fingers and arm separation are read.
 * @param upright The jump's upright clinical joints.
 * @param left The left shoulder flexion, degrees.
 * @param right The right shoulder flexion, degrees.
 * @returns A fresh clinical joint record and arm tuples.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the shared phases, clinical degree inputs and fresh returned ownership.
 * @evidence contracts/development/implementation.md#principled-implementation Preserves the existing jump table: relaxed hands and upright joints, shoulder flexions at the body's standing abduction, and elbow flexion 12 plus one third of the shoulder flexion.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One fresh joint table delegates body-dependent resting hands and abduction to stand.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Changes no joint angle, range or contact; phase endpoints and interior poses share the same authored table.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Fixed arm entries accompany the existing relaxed hand table; no algorithmic choice is involved.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One owner supplies push and flight arm formulas; both shoulders share the same call's body abduction read, while returned tuples remain independently owned.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; the caller owns the new record and arm tuples.
 */
export function jumpJoints(
  body: IHumanBody,
  upright: IHumanPosture["joints"],
  left: number,
  right: number,
): IHumanPosture["joints"] {
  const abduction: number = stand.abduction(body);
  return {
    ...stand.relaxed(body),
    ...upright,
    leftUpperArm: [left, abduction, 0],
    rightUpperArm: [right, abduction, 0],
    leftLowerArm: [12 + left / 3, 0, 0],
    rightLowerArm: [12 + right / 3, 0, 0],
  };
}
