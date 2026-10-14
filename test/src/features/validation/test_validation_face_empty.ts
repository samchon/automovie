import { validateFaceResult } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";
import { IAutoMovieValidation } from "@automovie/interface";

import { makeFace } from "../internal/fixtures";

/**
 * An empty face trait document is admitted as the neutral omission case.
 *
 * Scenarios:
 * 1. A face with zero parameters validates successfully.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls face validation on an empty document and requires success, catching a validator that treats omitted morph traits as a malformed face.
 * @evidence contracts/testing.md#independent-expectations Optional traits mean no authored morph changes, so the empty input has no weight outside the signed interval. Success is the asserted admission contract, not proof of rendered neutral geometry.
 * @evidence contracts/testing.md#distinguishing-cases Owns the empty boundary; populated accepted weights and each out-of-range direction are separate face-validation entries.
 * @evidence contracts/testing.md#execution-ownership The named synchronous unit calls the actual engine validator through the existing identity fixture without a Human asset, renderer or native artifact.
 */
export function test_validation_face_empty(): void {
  const result: IAutoMovieValidation = validateFaceResult(makeFace());
  TestValidator.equals("empty face succeeds", result.success, true);
}
