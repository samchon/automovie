import { HumanRefusal } from "./HumanRefusal";

/**
 * The refusal of a balance missing a field neither the caller nor the law
 * gives.
 */
export function HumanPhysicsMissing(field: string): HumanRefusal {
  return new HumanRefusal({
    kind: "parameter",
    axis: `balance.${field}`,
    value: undefined,
    feasible: null,
    reason: `the balance needs its ${field}, and the law recommends none`,
    fix: `give balance.${field}, or leave the balance out`,
  });
}
