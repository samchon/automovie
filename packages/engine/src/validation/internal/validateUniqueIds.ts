import type { IAutoMovieConstraintViolation } from "@automovie/interface";

import { validateUniqueBy } from "./validateUniqueBy";

/*
 * Map record ids to element paths before validateUniqueBy checks duplicates.
 */
export function validateUniqueIds(
  items: readonly { id: string }[],
  path: string,
  label: string,
  violations: IAutoMovieConstraintViolation[],
): void {
  validateUniqueBy(
    items.map(
      (item: { id: string }, index: number): { id: string; path: string } => ({
        id: item.id,
        path: `${path}[${index}].id`,
      }),
    ),
    label,
    violations,
  );
}
