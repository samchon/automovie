import { IAutoMovieConstraintViolation } from "@automovie/interface";

import { violation } from "./violation";

/** Record one violation into a collector the caller owns. */
export const pushViolation = (
  violations: IAutoMovieConstraintViolation[],
  kind: IAutoMovieConstraintViolation["kind"],
  path: string,
  expected: string,
  value: unknown,
): void => {
  violations.push(violation(kind, path, expected, value));
};
