import { IAutoMovieConstraintViolation } from "@automovie/interface";

import { isRecord } from "./isRecord";
import { validateArrayArtifact } from "./validateArrayArtifact";
import { validateUniqueBy } from "./validateUniqueBy";

/**
 * Admit an array and map shallow record ids to element paths before
 * validateUniqueBy checks string duplicates.
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
