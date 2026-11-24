import { TestValidator } from "@nestia/e2e";

import { FamilyConicMpfbSource } from "../../../reference-conics/FamilyConicMpfbSource";

/**
 * A made asymmetric skin quad and two joint markers in MakeHuman coordinates.
 * The helper vertex lies below the skin and the shoulder pair is offset from
 * the source origin.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Exercises geometry and landmark conversion through the shared asset parser.
 * @evidence contracts/development/testing.md#independent-expectations The example uses whole decimetres and explicit millimetre expectations.
 * @evidence contracts/development/testing.md#distinguishing-cases Body, joint and helper ownership differ, and the odd axis permutation has explicit winding expectations.
 * @evidence contracts/development/testing.md#execution-ownership The fixture is local and deterministic.
 */
export function test_human_mpfb_source(): void {
  const fixture: string = `
v 0 -3 1
v 2 -3 1
v 2 -2 2
v 0 -2 2
v 1 -10 -7
v 3 2 3
v 5 2 3
v 3 4 5
v 5 4 5
v -3 2 3
v -1 2 3
v -3 4 5
v -1 4 5
g body
f 1/6 2/5 3/4 4/3
g helper-tights
f 5 2 3 4
g joint-l-shoulder
f 6 7 8 9
f 9 8 7 6
g joint-r-shoulder
f 10 11 12 13
`;
  const { body, joints } = FamilyConicMpfbSource.parse(fixture);
  TestValidator.equals(
    "the body excludes both kinds of helpers",
    Array.from(body.positions),
    [100, 0, -100, 100, 0, 100, 200, 100, 100, 200, 100, -100],
  );
  TestValidator.equals(
    "the swapped axes preserve outward winding",
    Array.from(body.indices),
    [0, 2, 1, 0, 3, 2],
  );
  TestValidator.equals(
    "joint centres use the skin coordinate system",
    Array.from(joints),
    [
      ["joint-l-shoulder", [400, 600, 300]],
      ["joint-r-shoulder", [400, 600, -300]],
    ],
  );
}
