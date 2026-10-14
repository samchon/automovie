import {
  type AutoMovieViolationKind,
  type IAutoMovieConstraintViolation,
  type IAutoMovieValidation,
} from "@automovie/interface";

/** Match an advisory kind and path fragment only on a successful validation. */
export function hasWarning(
  v: IAutoMovieValidation,
  kind: AutoMovieViolationKind,
  pathIncludes: string,
): boolean {
  return (
    v.success === true &&
    (v.warnings ?? []).some(
      (x: IAutoMovieConstraintViolation): boolean =>
        x.kind === kind && x.path.includes(pathIncludes),
    )
  );
}
