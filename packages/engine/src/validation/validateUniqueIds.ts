import { IAutoMovieConstraintViolation } from "@automovie/interface";

import { isRecord } from "./isRecord";
import { validateArrayArtifact } from "./validateArrayArtifact";
import { validateUniqueBy } from "./validateUniqueBy";

/**
 * Admit an array and map shallow record ids to element paths before validateUniqueBy checks string duplicates.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Admit an array and densely enumerate shallow record ids/paths, including absent slots, before validateUniqueBy checks string duplicates.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Array shape, object shape and uniqueness delegate to canonical owners.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Malformed/non-string ids and absent slots are not element-admitted here; dense row construction prevents a hole from throwing inside uniqueness, while owning element gates report the malformed object.
 * @evidence contracts/development/common.md#meaningful-documentation Exact element id suffixes identify duplicates without resolving a registry.
 * @evidence contracts/development/implementation.md#efficient-algorithms N rows require mapping plus expected set work and proportional temporary row storage.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The common uniqueness owner supplies the same duplicate policy for all artifacts.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only diagnostics escape; temporary mapped rows/set storage release without a host registry.
 */
export const validateUniqueIds: (
  items: unknown,
  path: string,
  label: string,
  violations: IAutoMovieConstraintViolation[],
) => void = (
  items: unknown,
  path: string,
  label: string,
  violations: IAutoMovieConstraintViolation[],
): void => {
  if (!validateArrayArtifact(items, path, label, violations)) return;
  validateUniqueBy(
    Array.from(
      items,
      (item: unknown, index: number): { id: unknown; path: string } => ({
        id: isRecord(item) ? item.id : undefined,
        path: `${path}[${index}].id`,
      }),
    ),
    label,
    violations,
  );
};
