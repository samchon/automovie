import { morphFace } from "@automovie/engine";
import { type IAutoMovieFaceTemplate } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { makeFace } from "../internal/fixtures";
import { throwsError } from "../internal/predicates";

/**
 * A morph delta must have exactly the resting position array's component count.
 *
 * Scenarios:
 *
 * 1. A three-component template with a six-component eyeSizeR delta refuses that named target before returning geometry.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls morphFace with an authored eye trait whose corresponding delta is too long and requires an Error naming eyeSizeR and its six components, detecting silent truncation or acceptance of the corrupt target.
 * @evidence contracts/testing.md#independent-expectations The three resting components and six authored delta components establish the mismatch independently of morphFace; the required target name and observed component count describe the asset error, while fragment matching leaves the rest of its wording unconstrained.
 * @evidence contracts/testing.md#distinguishing-cases Owns a present but oversized target reached through a lone left eye side; matching lengths and signed accumulation are exercised by test_face_morph_apply, and an absent target by test_face_morph_unknown_target.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_face_morph_length_mismatch entry owns one in-process refusal and uses the shared throwsError observer; no consumer installation, native artifact, real process, browser or GPU is involved.
 */
export function test_face_morph_length_mismatch(): void {
  const template: IAutoMovieFaceTemplate = {
    positions: [0, 0, 0],
    targets: { eyeSizeR: [1, 0, 0, 0, 0, 0], eyeSizeL: [1, 0, 0] },
  };
  TestValidator.predicate(
    "mismatched delta length throws",
    throwsError(
      (): number[] =>
        morphFace({
          template,
          face: makeFace({ eyes: { left: { size: 1 } } }),
        }),
      ['morph target "eyeSizeR"', "6 components"],
    ),
  );
}
