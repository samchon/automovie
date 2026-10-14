import { morphFace } from "@automovie/engine";
import { type IAutoMovieFaceTemplate } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { makeFace } from "../internal/fixtures";
import { nclose } from "../internal/predicates";

/**
 * An omitted-trait face returns the template's resting values in a distinct array.
 *
 * Scenarios:
 *
 * 1. An empty face and empty target map preserve [1, 2, 3] and return an array distinct from the supplied positions.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls morphFace with no authored traits and checks component count, all resting values and distinct array identity, detecting invented deformation or an aliased output while allowing a fresh copy.
 * @evidence contracts/testing.md#independent-expectations The authored resting coordinates [1, 2, 3] are the neutral result under zero blendshape contributions; identity is compared directly and finite coordinates use nclose with 1e-12 tolerance. No product projection supplies expected values.
 * @evidence contracts/testing.md#distinguishing-cases Owns the entirely empty trait and target case with a nonempty resting vertex; signed accumulation, mirrored sides and corrupt-target refusals belong to the other morphFace tests.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous test_face_morph_empty entry runs one portable engine call in-process using the existing empty makeFace record and starts no installation, process, browser or GPU.
 */
export function test_face_morph_empty(): void {
  const template: IAutoMovieFaceTemplate = {
    positions: [1, 2, 3],
    targets: {},
  };
  const result: number[] = morphFace({ template, face: makeFace() });
  const expected: readonly number[] = [1, 2, 3];
  TestValidator.equals(
    "unchanged component count",
    result.length,
    expected.length,
  );
  TestValidator.predicate(
    "unchanged values",
    expected.every((value: number, index: number): boolean =>
      nclose(result[index]!, value, 1e-12),
    ),
  );
  TestValidator.predicate(
    "a copy, not the template array",
    result !== template.positions,
  );
}
