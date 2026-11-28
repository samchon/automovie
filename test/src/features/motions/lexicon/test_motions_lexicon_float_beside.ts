import {
  humanFloatBesideAdmit
} from "../../../../../packages/motions/src/lexicon/internal/humanFloatBesideAdmit";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * The `HumanFloatBeside` law's admission (`humanFloatBesideAdmit`): the rider
 * slides off a swimming horse over a transition shorter than the float, on a
 * side the water leaves open, cued `slideOff` and `afloat`.
 *
 * Scenarios:
 *
 * 1. A 4 s float sliding off the left over 1 s is afloat at a quarter of it.
 * 2. Sliding off a blocked side, or over the whole float, is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines cue times and an open-side admission for a virtual float transition shorter than its hold.
 * @evidence contracts/development/testing.md#behavioral-verification Plans a left exit over one second in a four-second float and tries a blocked side and a same-duration transition.
 * @evidence contracts/development/testing.md#independent-expectations The timing ratio gives afloat progress one quarter. A closed side or transition consuming the entire float is inadmissible.
 */
export function test_motions_lexicon_float_beside(): void {
  TestValidator.equals(
    "the float's cues",
    humanFloatBesideAdmit({ duration: 4, transition: 1, side: "left" }),
    [
      { name: "slideOff", share: 0 },
      { name: "afloat", share: 0.25 },
    ],
  );
  TestValidator.predicate(
    "blocked, or too long",
    throwsError(() =>
      humanFloatBesideAdmit({
        duration: 4,
        transition: 1,
        side: "left",
        blocked: ["left"],
      }),
    ) &&
      throwsError(() =>
        humanFloatBesideAdmit({ duration: 4, transition: 4, side: "left" }),
      ),
  );
}
