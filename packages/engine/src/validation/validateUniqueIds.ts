import { IAutoMovieConstraintViolation } from "@automovie/interface";
import { isRecord } from "./isRecord";
import { validateArrayArtifact } from "./validateArrayArtifact";
import { validateUniqueBy } from "./validateUniqueBy";

/**
 * Validate that object-array string ids are unique.
 *
 * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation `validateUniqueIds` locates duplicate string identities at the exact object-array element whose id repeats.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure `validateUniqueIds` derives stable element-id paths before applying the structural uniqueness check.
 */
export const validateUniqueIds = (
  items: unknown,
  path: string,
  label: string,
  violations: IAutoMovieConstraintViolation[],
): void => {
  if (!validateArrayArtifact(items, path, label, violations)) return;
  validateUniqueBy(
    items.map((item, index) => ({
      id: isRecord(item) ? item.id : undefined,
      path: `${path}[${index}].id`,
    })),
    label,
    violations,
  );
};
