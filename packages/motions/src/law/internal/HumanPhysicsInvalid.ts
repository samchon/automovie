import { AutoMovieMotionHumanRefusal } from "../AutoMovieMotionHumanRefusal";

/*
 * A parameter error with the balance term the author needs to correct.
 */
export function HumanPhysicsInvalid(
  field: string,
  value: unknown,
  fix: string,
): AutoMovieMotionHumanRefusal {
  return new AutoMovieMotionHumanRefusal({
    kind: "parameter",
    axis: `balance.${field}`,
    value,
    feasible: null,
    reason: `the balance cannot use this ${field}`,
    fix,
  });
}
