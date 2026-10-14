import { flattenHead } from "@automovie/engine";
import { type AutoMovieHeadParameterName, type IAutoMovieHead } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

/**
 * Grouped head leaves retain their weights under the flat morph vocabulary.
 *
 * Scenarios:
 *
 * 1. Three supplied groups produce exactly seven named weights while omitted groups and leaves contribute no keys.
 * 2. An empty head document produces an empty record.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls flattenHead and checks the exact emitted key set and each copied scalar, detecting a wrong renaming, changed weight, or invented omitted trait while allowing the authored seven values unchanged.
 * @evidence contracts/testing.md#independent-expectations The literal expected record expresses the grouped-to-flat vocabulary for the seven supplied leaves independently of the implementation table; finite scalar comparisons use 1e-12 tolerance. This does not exhaust the other head vocabulary entries.
 * @evidence contracts/testing.md#distinguishing-cases Covers positive and negative weights in shape, eyes and jaw, absent leaves within those groups, four absent groups, and the entirely empty document; face-template composition and refusal belong to the morphFace tests.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous test_engine_flatten_head entry owns both in-process cases and calls the engine projection directly without installing a consumer or creating a process, browser, GPU, or Human asset.
 */
export function test_engine_flatten_head(): void {
  const doc: IAutoMovieHead = {
    shape: { width: 0.5, oval: -1 },
    eyes: { size: 1, epicanthus: 0.8, fold: -0.5 },
    jaw: { width: -0.7, chinProjection: -0.3 },
  };
  const expected: Partial<Record<AutoMovieHeadParameterName, number>> = {
    faceWidth: 0.5,
    faceOval: -1,
    eyeSize: 1,
    epicanthus: 0.8,
    eyeFold: -0.5,
    jawWidth: -0.7,
    chinProject: -0.3,
  };
  const result: Partial<Record<AutoMovieHeadParameterName, number>> = flattenHead(doc);
  TestValidator.equals(
    "grouped leaves map to exactly the flat morph names",
    Object.keys(result).sort((left: string, right: string): number => Number(left > right) - Number(left < right)),
    Object.keys(expected).sort((left: string, right: string): number => Number(left > right) - Number(left < right)),
  );
  for (const [name, weight] of Object.entries(expected))
    TestValidator.predicate(
      `weight of ${name} is unchanged`,
      nclose(result[name as AutoMovieHeadParameterName]!, weight, 1e-12),
    );
  TestValidator.equals(
    "empty document yields empty record",
    flattenHead({}),
    {},
  );
}
