import { HumanRefusal } from "../HumanRefusal";

/*
 * A parameter error with the balance term the author needs to correct.
 */
export function HumanPhysicsInvalid(
  field: string,
  value: unknown,
  fix: string,
): HumanRefusal {
  return new HumanRefusal({
    kind: "parameter",
    axis: `balance.${field}`,
    value,
    feasible: null,
    reason: `the balance cannot use this ${field}`,
    fix,
  });
}
