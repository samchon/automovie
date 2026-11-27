import { IAutoMovieConstraintViolation } from "@automovie/interface";

import { violation } from "./violation";

/*
 * Append a typed artifact fault with the supplied path, expected meaning and
 * actual value.
 */
export function pushViolation(
  violations: IAutoMovieConstraintViolation[],
  kind: IAutoMovieConstraintViolation["kind"],
  path: string,
  expected: string,
  value: unknown,
): void {
  violations.push(violation(kind, path, expected, value));
}
