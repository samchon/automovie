import { HumanRefusal } from "../law/HumanRefusal";

/**
 * How far a pull raises the clay wall, metres of the wheel's `raise` slider:
 * the authored rise, or by default what remains of the slider's travel from
 * where it stands.
 *
 * Refuses a rise that is not positive or that would run past the travel.
 */
export function throwPotteryRise(
  rise: number | undefined,
  travel: number,
  start: number,
): number {
  const raised: number = rise ?? travel - start;
  if (!(raised > 0 && start + raised <= travel + 1e-9))
    throw new HumanRefusal({
      kind: "parameter",
      axis: "rise",
      value: raised,
      feasible: {
        kind: "range",
        minimum: 0,
        maximum: travel - start,
        unit: "m",
      },
      reason: "the wall rises within the wheel's travel",
      fix: "give a rise up to what remains of the wheel's",
    });
  return raised;
}
