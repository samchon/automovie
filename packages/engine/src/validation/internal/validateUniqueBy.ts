import {
  IAutoMovieConstraintViolation,
  type IAutoMovieValidateUniqueBy,
} from "@automovie/interface";

import { pushViolation } from "../pushViolation";

/** Scan ids with a seen set, reporting later occurrences at supplied paths. */
export function validateUniqueBy(
  entries: IAutoMovieValidateUniqueBy.IEntries,
  label: string,
  violations: IAutoMovieConstraintViolation[],
): void {
  const seen: Set<string> = new Set<string>();
  for (const entry of entries) {
    if (seen.has(entry.id))
      pushViolation(
        violations,
        "type",
        entry.path,
        `${label} "${entry.id}" must be unique`,
        entry.id,
      );
    seen.add(entry.id);
  }
}
