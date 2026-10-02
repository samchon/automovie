import {
  resolveHumanFaceContact,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceContactPlaneFixture as fixture } from "../internal/humanFaceContactPlaneFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Original collider floors and one Euclidean movement budget are simultaneous.
 * No actor, image or changed epsilon enters these analytic cases.
 *
 * Scenarios:
 * 1. Orthogonal 0.8 mm corrections require sqrt(2)*0.8 mm: budget 1 mm refuses
 *    and every supplied pose buffer remains unchanged.
 * 2. Adjacent feasible 0.6 mm corrections pass; spread neighbours remain bounded.
 *    An inactive opposite diagonal floor below -budget remains satisfied when
 *    its row is omitted from the solve by the unit-normal norm bound.
 * 3. The 0.6/0.8 mm boundary passes within the existing clearance tolerance.
 * 4. Normals (+-0.6,0.48,0.64) each require 10 mm. Their true minimum is
 *    (0,7.5,10) mm, length 12.5 mm inside 13 mm; sequential 13.86 mm is unnecessary.
 * 5. A single exact active floor retains its boundary correction and zero
 *    budget accepts an unchanged point whose original floors are satisfied.
 * 6. Floors 0.3 nm past what the 1 mm budget reaches (0.6 and 0.8000004 mm) are
 *    met within the fixture's 1 nm tolerance, inside the budget: half the
 *    tolerance relaxes a floor only where the budget cannot reach it, so the
 *    candidate does not land on the admission edge.
 */
export const test_subject_human_contact_joint_budget = (): void => {
  const orthogonal = [[1, 0, 0], [0, 1, 0]];
  const impossible = fixture(orthogonal, [-0.0008, -0.0008, 0], 0.001);
  const before = JSON.stringify([...impossible.posed]);
  TestValidator.predicate(
    "two individually allowed corrections exceed the joint budget",
    throwsError(() => resolveHumanFaceContact(
      impossible.basis, impossible.basis.contact!, impossible.posed, impossible.shaped,
    ), ["budget-soft", "vertex 0", "net tissue budget"]),
  );
  TestValidator.equals("refusal preserves every pose buffer", JSON.stringify([...impossible.posed]), before);
  const admitted = (state: ReturnType<typeof fixture>, normals: number[][]) => {
    const initial = [...state.posed.get("budget-soft")!];
    const summary = resolveHumanFaceContact(state.basis, state.basis.contact!, state.posed, state.shaped);
    const positions = state.posed.get("budget-soft")!;
    const tolerance = state.basis.contact!.toleranceMetres;
    const travel = Math.hypot(...state.point.map((value, axis) => positions[axis] - value));
    TestValidator.predicate("actual displacement is inside the original budget", travel <= state.budget);
    TestValidator.predicate("every original analytic plane remains clear", normals.every((normal) =>
      normal.reduce((sum, value, axis) => sum + value * positions[axis], 0) >= -tolerance));
    TestValidator.equals("only the directly corrected weld is counted", summary[0].vertices, 1);
    TestValidator.predicate("summary retains initial penetration rather than net travel",
      nclose(summary[0].maxDepthMetres, Math.max(...normals.map((normal) =>
        -normal.reduce((sum, value, axis) => sum + value * state.point[axis], 0))), 1e-12));
    for (const vertex of [1, 2])
      TestValidator.predicate("one-ring actual movement stays inside the budget",
        Math.hypot(...[0, 1, 2].map((axis) => positions[3 * vertex + axis] - initial[3 * vertex + axis])) <= state.budget);
    return { travel, positions, tolerance };
  };
  admitted(fixture(orthogonal, [-0.0006, -0.0006, 0], 0.001), orthogonal);
  const redundant = [...orthogonal, [-Math.SQRT1_2, -Math.SQRT1_2, 0]];
  admitted(fixture(redundant, [-0.0006, -0.0006, 0], 0.001), redundant);
  const boundary = admitted(fixture(orthogonal, [-0.0006, -0.0008, 0], 0.001), orthogonal);
  TestValidator.predicate("joint budget boundary retains the required motion",
    boundary.travel >= 0.001 - Math.SQRT2 * boundary.tolerance);
  const opposed = [[0.6, 0.48, 0.64], [-0.6, 0.48, 0.64]];
  const feasible = admitted(fixture(opposed, [0, -0.0075, -0.010], 0.013), opposed);
  TestValidator.predicate("coupled feasible minimum", nclose(feasible.travel, 0.0125, 1e-7));
  const single = fixture([[1, 0, 0]], [-0.0008, 0, 0], 0.0008);
  TestValidator.predicate("exact single-floor budget boundary",
    nclose(admitted(single, [[1, 0, 0]]).travel, 0.0008, 1e-12));
  const past = admitted(fixture(orthogonal, [-0.0006, -0.0008000004, 0], 0.001), orthogonal);
  TestValidator.predicate("floors past the budget relax by the tolerance and stay inside it",
    past.travel <= 0.001 && past.travel >= Math.hypot(0.0006, 0.0008000004) - Math.SQRT2 * past.tolerance);
  const resting = fixture(orthogonal, [0.0008, 0.0008, 0], 0);
  resting.shaped.get("budget-soft")!.splice(0, 3, ...resting.point);
  TestValidator.equals("zero budget leaves an admitted rest point unchanged",
    resolveHumanFaceContact(resting.basis, resting.basis.contact!, resting.posed, resting.shaped)[0].vertices, 0);
};
