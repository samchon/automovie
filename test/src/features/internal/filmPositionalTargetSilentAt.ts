import type { IAutoMovieConstraintViolation } from "@automovie/interface";

import type { IAutoMoviePerformedShot } from "../../../../packages/engine/src/film/IAutoMoviePerformedShot";

/** Observe absence of the positional unit's authored diagnostic path on success or every failure item. The expected path is supplied by the existing camera-as-actor counterexample, so this checks localized over-rejection and does not promise overall success or independently prove target geometry. The positional unit owns execution through this portable predicate. */
export function filmPositionalTargetSilentAt(
  result: IAutoMoviePerformedShot,
  path: string,
): boolean {
  return (
    result.success === true ||
    result.violations.every(
      (item: IAutoMovieConstraintViolation): boolean => item.path !== path,
    )
  );
}
