import {
  AutoMovieViolationKind,
  IAutoMovieConstraintViolation,
} from "@automovie/interface";

/** Build one {@link IAutoMovieConstraintViolation}. Defaults to `"error"`. */
export const violation = (
  kind: AutoMovieViolationKind,
  path: string,
  expected: string,
  value: unknown,
  overshoot?: number,
  severity: "error" | "warning" = "error",
): IAutoMovieConstraintViolation =>
  overshoot === undefined
    ? { kind, path, expected, value, severity }
    : { kind, path, expected, value, overshoot, severity };
