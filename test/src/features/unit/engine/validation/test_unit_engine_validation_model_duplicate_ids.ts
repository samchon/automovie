import { validateModel } from "@automovie/engine";
import {
  IAutoMovieModel,
  IAutoMovieSkeleton,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createModel } from "../../../internal/fixtures";
import { hasViolation } from "../../../internal/predicates";

/**
 * Model-local materials, parts and skeleton bones have unique identifiers
 * within their respective populations.
 *
 * Scenarios:
 *
 * 1. Repeated material id, part id and bone name produce type findings at each
 *    second occurrence.
 */
export function test_unit_engine_validation_model_duplicate_ids(): void {
  const base: IAutoMovieModel = createModel();
  const skeleton: IAutoMovieSkeleton = base.skeleton!;
  const duplicate: IAutoMovieValidation = validateModel({
    model: {
      ...base,
      materials: [
        base.materials[0]!,
        { ...base.materials[0]!, name: "duplicate material" },
      ],
      parts: [base.parts[0]!, { ...base.parts[0]!, name: "duplicate part" }],
      skeleton: {
        ...skeleton,
        bones: [
          skeleton.bones[0]!,
          { ...skeleton.bones[1]!, bone: skeleton.bones[0]!.bone },
        ],
      },
    },
  });

  TestValidator.equals("duplicate identifiers fail", duplicate.success, false);
  TestValidator.predicate(
    "duplicate material id violation",
    hasViolation(duplicate, "type", "$input.materials[1].id"),
  );
  TestValidator.predicate(
    "duplicate part id violation",
    hasViolation(duplicate, "type", "$input.parts[1].id"),
  );
  TestValidator.predicate(
    "duplicate skeleton bone violation",
    hasViolation(duplicate, "type", "$input.skeleton.bones[1].bone"),
  );
}
