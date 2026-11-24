import type { AutoMovieVector3Tuple } from "@automovie/interface";

import { FamilyConicFit as Fit } from "../../../reference-conics/FamilyConicFit";

/**
 * The group fit's partial refusal and its non-neighbour clearance row.
 *
 * Scenarios:
 * 1. While restoring, a trial whose read rows reach the current largest row is refused as partial; one below it is not.
 * 2. While fitting, a read row over the tolerance refuses and one at it does not; without a ceiling nothing refuses.
 * 3. Two unit circles with centres 4 mm apart are 2 mm apart along -x; moving toward each other at 1 mm per unit each, the distance
 *    falls at 2 per unit. Touching circles refuse.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `ceilingOf`, `partialRefusal` and `clearance` as `fitGroup` and `endMaterialRows` do.
 * @evidence contracts/development/testing.md#independent-expectations Acceptance is `after < before` while restoring and `after <= tolerance` while fitting, and the largest row bounds `after` from below. The circles' gap is `4 - 1 - 1` and its rate the closing speed.
 * @evidence contracts/development/testing.md#distinguishing-cases Each bound is read on both sides of its equality.
 * @evidence contracts/development/testing.md#execution-ownership Made rows and sampled circles only.
 * @evidence contracts/development/common.md#meaningful-documentation Names both acceptance phases, the partial message and the circles' closed form.
 */
export function test_human_group_trial_bounds(): void {
  const failures: string[] = [];
  const restoring: Fit.IGroupCeiling = Fit.ceilingOf(3, 1e-8), fitting: Fit.IGroupCeiling = Fit.ceilingOf(1e-9, 1e-8);
  if (restoring.value !== 3 || !restoring.inclusive || fitting.value !== 1e-8 || fitting.inclusive)
    failures.push("the acceptance ceilings are not the restoring maximum and the fitting tolerance");
  const refuse = (ceiling: Fit.IGroupCeiling | undefined, values: number[]): boolean =>
    Fit.partialRefusal(ceiling, [{ family: "made", values }], ["host"]) !== null;
  if (!refuse(restoring, [1, 3]) || refuse(restoring, [1, 2.999]))
    failures.push("restoring: a row at the current maximum must refuse and one under it must not");
  if (!refuse(fitting, [2e-8]) || refuse(fitting, [1e-8]) || refuse(undefined, [100]))
    failures.push("fitting: a row over the tolerance must refuse, one at it and an absent ceiling must not");
  const message: string | null = Fit.partialRefusal(restoring, [{ family: "made", values: [4] }], ["host"]);
  if (message === null || !message.includes("partial") || !message.includes("unread: host"))
    failures.push("a partial refusal does not name itself partial with its unread rows");

  const circle = (x: number): AutoMovieVector3Tuple[] =>
    Array.from({ length: 64 }, (_, k: number): AutoMovieVector3Tuple => [x + Math.cos((Math.PI * k) / 32), Math.sin((Math.PI * k) / 32), 0]);
  const near: ReturnType<typeof Fit.clearance> = Fit.clearance(circle(0), circle(4));
  const rate: number = near.normal[0] * (1 - -1) + near.normal[1] * 0 + near.normal[2] * 0;
  if (!(Math.abs(near.distance - 2) <= 1e-12) || !(Math.abs(rate + 2) <= 1e-12))
    failures.push("the circles' clearance is " + near.distance + " at rate " + rate + " against 2 and -2");
  try {
    Fit.clearance(circle(0), circle(2));
    failures.push("touching circles were given a clearance");
  } catch {
    // Touching cuts have no separation to keep.
  }
  if (failures.length > 0) throw new Error("group trial bounds:\n" + failures.join("\n"));
}
