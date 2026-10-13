import { type AutoMovieViolationKind, type IAutoMovieValidation, type IAutoMovieConstraintViolation } from "@automovie/interface";

/** Match a violation kind and path fragment only on an unsuccessful validation. */
export function hasViolation(
  v: IAutoMovieValidation,
  kind: AutoMovieViolationKind,
  pathIncludes: string,
): boolean {
  return v.success === false &&
  v.violations.some((x: IAutoMovieConstraintViolation): boolean => x.kind === kind && x.path.includes(pathIncludes));
}
