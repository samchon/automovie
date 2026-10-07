import { humanBodyShoulderOrientationDistance } from "@automovie/human/body/basis/humanBodyShoulderOrientationDistance";
import type { IBodyShoulderMotionInput } from "./IBodyShoulderMotionInput";

/**
 * Bind each complete TT goal to the same shape's actual rest readout.
 * The session and its driver owner use these owned records for physical travel
 * and kernel support. A missing rest is a refusal, not a fixed-neutral guess.
 *
 * @evidence contracts/common.md#principled-implementation The goal/rest pair and shortest SO(3) travel retain the current shaped skeleton authority.
 * @evidence contracts/common.md#clear-and-simple-design One match and the shared distance owner produce each motion record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing rests receive no metadata fallback or invented angle.
 * @evidence contracts/common.md#meaningful-documentation States actual session/driver consumers and owned records.
 */
export function readBodyCorrectiveShoulderMotion(input: IBodyShoulderMotionInput) {
  return input.goals.map((goal) => {
    const rest = input.rests.find((pose) => pose.bone === goal.bone);
    if (rest === undefined) throw new Error("A TT motion needs the same shaped rest: " + goal.bone);
    return { rest: { ...rest }, target: { ...goal }, travelDegrees: humanBodyShoulderOrientationDistance(rest, goal) };
  });
}
