import type {
  IAutoMovieMaterial,
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { validateModel } from "../../../../packages/engine/src/validation/validateModel";
import { createModel } from "../internal/createModel";
import { hasViolation } from "../internal/hasViolation";

/**
 * Exercise nonblank model identities and non-null references at their owning diagnostic addresses.
 *
 * Scenarios:
 * 1. Blank model/skeleton/material/part ids plus blank non-null asset and texture ids fail at their own fields; an undefined bone identity is also refused.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls validateModel with blank identities/references and an undefined bone name, requiring each field's type finding rather than only an aggregate failure.
 * @evidence contracts/testing.md#independent-expectations Stable references require non-whitespace identifiers; undefined is not a bone identifier. Literal addresses identify each authored defect without copying validator output.
 * @evidence contracts/testing.md#distinguishing-cases Covers empty, whitespace and malformed identities across model, asset, skeleton, material, texture and part fields; model_valid owns their supported neighbor.
 * @evidence contracts/testing.md#execution-ownership The named unit validates caller-created records through the existing model factory; no external asset is resolved or generated.
 */
export function test_validation_model_nonempty_ids(): void {
  const base: IAutoMovieModel = createModel();
  const invalid: IAutoMovieValidation = validateModel({
    model: {
      ...base,
      id: "",
      asset: " ",
      skeleton: { ...base.skeleton!, id: " " },
      materials: base.materials.map(
        (material: IAutoMovieMaterial): IAutoMovieMaterial => ({
          ...material,
          id: "",
          baseColorTexture: " ",
        }),
      ),
      parts: base.parts.map(
        (part: IAutoMovieModelPart): IAutoMovieModelPart => ({
          ...part,
          id: " ",
          material: "",
        }),
      ),
    },
  });

  TestValidator.equals("blank ids fail", invalid.success, false);
  TestValidator.predicate(
    "model id violation",
    hasViolation(invalid, "type", "$input.id"),
  );
  TestValidator.predicate(
    "model asset violation",
    hasViolation(invalid, "type", "$input.asset"),
  );
  TestValidator.predicate(
    "skeleton id violation",
    hasViolation(invalid, "type", "$input.skeleton.id"),
  );
  TestValidator.predicate(
    "material id violation",
    hasViolation(invalid, "type", "$input.materials[0].id"),
  );
  TestValidator.predicate(
    "material texture id violation",
    hasViolation(invalid, "type", "$input.materials[0].baseColorTexture"),
  );
  TestValidator.predicate(
    "part id violation",
    hasViolation(invalid, "type", "$input.parts[0].id"),
  );
  TestValidator.predicate(
    "part material reference violation",
    hasViolation(invalid, "type", "$input.parts[0].material"),
  );

  const malformedBone: IAutoMovieValidation = validateModel({
    model: {
      ...base,
      skeleton: {
        ...base.skeleton!,
        bones: [
          {
            ...base.skeleton!.bones[0]!,
            bone: undefined,
          },
        ],
      },
    } as unknown as IAutoMovieModel,
  });
  TestValidator.equals(
    "malformed skeleton bone id fails",
    malformedBone.success,
    false,
  );
  TestValidator.predicate(
    "skeleton bone id violation",
    hasViolation(malformedBone, "type", "$input.skeleton.bones[0].bone"),
  );
}
