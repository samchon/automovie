import { assertHumanFaceBasis, resolveHumanFaceContact } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceContactPlaneFixture as fixture } from "../internal/humanFaceContactPlaneFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Contact groups coincident posed seam copies and spreads only to neighbours
 * of those groups. The count describes directly corrected groups, while the
 * final caller buffers preserve every seam copy and the half-mean rule.
 *
 * Scenarios:
 * 1. Two directly pressed groups share one neighbour. Each returns to x=0;
 *    that neighbour takes half their mean (0.8+0.6)/4 = 0.35 mm.
 * 2. Distinct neutral vertices coincide when posed. One welded group is
 *    queried, moved and counted; its collapsed self-link adds no spreading.
 * 3. A resident vertex outside the surface triangles is corrected without
 *    inventing neighbours, while the unpressed triangle remains unchanged.
 * 4. A caller-supplied nonfinite posed neighbour cannot acquire a verified
 *    displacement through spreading; refusal preserves those supplied values.
 */
export const test_subject_human_contact_weld_spread = (): void => {
  const mean = fixture([[1, 0, 0]], [-0.0008, 0, 0], 0.001);
  const soft = mean.basis.surfaces.find((one) => one.id === "budget-soft")!;
  soft.positions.splice(3, 3, 0.0006, 0.01, 0);
  mean.shaped.get(soft.id)!.splice(3, 3, 0.0006, 0.01, 0);
  mean.posed.get(soft.id)!.splice(3, 3, -0.0006, 0.01, 0);
  assertHumanFaceBasis(mean.basis);
  const remoteX = mean.posed.get(soft.id)![6];
  const summary = resolveHumanFaceContact(mean.basis, mean.basis.contact!, mean.posed, mean.shaped);
  TestValidator.equals("two direct groups are counted", summary[0].vertices, 2);
  TestValidator.predicate("direct groups stay on their verified floor",
    mean.posed.get(soft.id)![0] === 0 && mean.posed.get(soft.id)![3] === 0);
  TestValidator.predicate("shared neighbour receives half the mean",
    nclose(mean.posed.get(soft.id)![6] - remoteX, 0.00035, 1e-12));

  const welded = fixture([[1, 0, 0]], [-0.0008, 0, 0], 0.001);
  welded.posed.get("budget-soft")!.splice(3, 3, -0.0008, 0, 0);
  const weldSummary = resolveHumanFaceContact(welded.basis, welded.basis.contact!, welded.posed, welded.shaped);
  TestValidator.equals("posed seam copies count once", weldSummary[0].vertices, 1);
  TestValidator.predicate("posed seam copies stay coincident",
    [0, 1, 2].every((axis) => nclose(welded.posed.get("budget-soft")![axis], welded.posed.get("budget-soft")![3 + axis], 0)));

  const isolated = fixture([[1, 0, 0]], [-0.0008, 0, 0], 0.001);
  const resident = isolated.basis.surfaces.find((one) => one.id === "budget-soft")!;
  resident.positions.push(0.0006, 0.01, 0);
  isolated.shaped.get(resident.id)!.push(0.0006, 0.01, 0);
  isolated.posed.get(resident.id)!.splice(0, 3, 0.0008, 0, 0);
  isolated.posed.get(resident.id)!.push(-0.0006, 0.01, 0);
  assertHumanFaceBasis(isolated.basis);
  const triangleBefore = isolated.posed.get(resident.id)!.slice(0, 9);
  const alone = resolveHumanFaceContact(isolated.basis, isolated.basis.contact!, isolated.posed, isolated.shaped);
  TestValidator.equals("unreferenced resident group is corrected once", alone[0].vertices, 1);
  TestValidator.predicate("isolated correction leaves the triangle untouched",
    isolated.posed.get(resident.id)!.slice(0, 9).every((value, index) => value === triangleBefore[index]));
  TestValidator.predicate("isolated group attains its floor", isolated.posed.get(resident.id)![9] === 0);

  const malformed = fixture([[1, 0, 0]], [-0.0008, 0, 0], 0.001);
  const supplied = malformed.posed.get("budget-soft")!;
  supplied[4] = Infinity;
  const malformedBefore = [...supplied];
  TestValidator.predicate("nonfinite spread displacement is unverifiable",
    throwsError(() => resolveHumanFaceContact(malformed.basis, malformed.basis.contact!, malformed.posed, malformed.shaped),
      ["unverified net contact move", "vertex 1"]));
  TestValidator.predicate("nonfinite refusal preserves the supplied values",
    supplied.every((value, index) => Object.is(value, malformedBefore[index])));
};
