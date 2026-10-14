import { morphFace } from "@automovie/engine";
import { type IAutoMovieFaceTemplate } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { makeFace } from "../internal/fixtures";
import { nclose } from "../internal/predicates";

/**
 * Signed blendshape contributions accumulate, and a lone eye side drives both corresponding targets.
 *
 * Scenarios:
 *
 * 1. Two vertices receive eyeSizeR and eyeSizeL at weight 0.5 and jawWidth at weight -1, producing [0.7, 2.2, 0, -1, 1, 0.3].
 *
 * @evidence contracts/testing.md#behavioral-verification Calls morphFace on a two-vertex template and checks all six output components, catching overwritten rather than accumulated deltas, an ignored negative weight, or omission of one mirrored eye target while allowing untouched components to retain their base values.
 * @evidence contracts/testing.md#independent-expectations The literal result follows base plus each authored weight times its target component: the first coordinate is 1 + 0.5 * 0.25 + 0.5 * 0.15 - 0.5 and the last is 0.5 * 0.5 + 0.5 * 0.1. A 1e-12 absolute tolerance accounts for decimal binary rounding rather than claiming these inputs are all exact binary fractions.
 * @evidence contracts/testing.md#distinguishing-cases Covers positive paired contributions, a negative symmetric contribution, affected and unchanged components, and a lone left side mirrored to both targets; empty input, missing targets and mismatched lengths have separate morphFace tests.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_face_morph_apply entry owns one portable arithmetic case and calls the engine directly with existing makeFace data, without a process, browser, GPU, installation or numerical Human asset.
 */
export function test_face_morph_apply(): void {
  const template: IAutoMovieFaceTemplate = {
    positions: [1, 2, 0, -1, 1, 0],
    targets: {
      eyeSizeR: [0.25, 0.25, 0, 0, 0, 0.5],
      eyeSizeL: [0.15, 0.15, 0, 0, 0, 0.1],
      jawWidth: [0.5, 0, 0, 0, 0, 0],
    },
  };
  const result: number[] = morphFace({
    template,
    face: makeFace({ eyes: { left: { size: 0.5 } }, jaw: { width: -1 } }),
  });
  const expected: readonly number[] = [0.7, 2.2, 0, -1, 1, 0.3];
  TestValidator.equals(
    "output component count",
    result.length,
    expected.length,
  );
  TestValidator.predicate(
    "accumulated signed morph",
    expected.every((value: number, index: number): boolean =>
      nclose(result[index]!, value, 1e-12),
    ),
  );
}
