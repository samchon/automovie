import { morphFace } from "@automovie/engine";
import { type IAutoMovieFaceTemplate } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { makeFace } from "../internal/fixtures";
import { throwsError } from "../internal/predicates";

/**
 * An authored face trait requires its matching morph target in the supplied template.
 *
 * Scenarios:
 *
 * 1. A template containing only eyeSize refuses a jaw.width contribution because jawWidth is absent.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls morphFace with jaw.width against a template lacking jawWidth and requires the missing-target Error, detecting a silently skipped authored trait while allowing the unrelated template entry to remain unused.
 * @evidence contracts/testing.md#independent-expectations The authored jaw field names jawWidth under the face vocabulary, and that key is visibly absent from the literal target map; the required message fragment identifies the missing asset rather than reproducing a computed result.
 * @evidence contracts/testing.md#distinguishing-cases Owns a missing target in a nonempty target map, distinct from the oversized present target and valid accumulation covered by the other morphFace tests; range validation of face weights belongs to validateFace tests.
 * @evidence contracts/testing.md#execution-ownership The portable synchronous test_face_morph_unknown_target entry owns its literal refusal case and observes the direct engine call through throwsError without starting a host or creating Human geometry.
 */
export function test_face_morph_unknown_target(): void {
  const template: IAutoMovieFaceTemplate = {
    positions: [0, 0, 0],
    targets: { eyeSize: [1, 0, 0] },
  };
  TestValidator.predicate(
    "missing morph target throws",
    throwsError(
      (): number[] =>
        morphFace({
          template,
          face: makeFace({ jaw: { width: 1 } }),
        }),
      'face template has no morph target "jawWidth"',
    ),
  );
}
