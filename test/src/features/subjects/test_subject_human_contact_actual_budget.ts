import { createAutoMovieSignedMeshQuery } from "@automovie/engine";
import { resolveHumanFaceContact } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceContactPlaneFixture as fixture } from "../internal/humanFaceContactPlaneFixture";
import { throwsError } from "../internal/predicates";

/**
 * The movement budget belongs to the coordinates actually published. A local
 * vector's norm alone misses rounding when adding that vector to a translated
 * point, even though each original signed query remains within tolerance.
 *
 * Scenarios:
 * 1. A translated tilted plane has a single-floor normal correction. The
 *    declared budget admits both its measured depth and local-vector norm,
 *    but rounded published coordinates move farther. Final net verification
 *    refuses and leaves every supplied coordinate unchanged.
 * 2. The same geometry with a 1 mm budget admits the correction, and the
 *    actual published displacement is inside that declared bound.
 */
export const test_subject_human_contact_actual_budget = (): void => {
  const state = fixture([[0.6, 0.8, 0]], [0, -0.0008, 0], 0.001);
  for (const map of [state.shaped, state.posed]) {
    const plane = map.get("budget-plane-0")!;
    for (let at = 0; at < plane.length; at += 3) plane[at] += 0.5;
    map.get("budget-soft")![0] += 0.5;
  }
  const point = state.posed.get("budget-soft")!.slice(0, 3);
  const query = createAutoMovieSignedMeshQuery({
    positions: state.posed.get("budget-plane-0")!, indices: [0, 1, 2],
    normals: null, uvs: null, skin: null,
  }, { boundary: "open" });
  const hit = query(point);
  const depth = -hit.signedDistance;
  const normalMove = hit.normal.map((value) => value * depth);
  const localBudget = Math.max(depth, Math.hypot(...normalMove));
  const roundedTravel = Math.hypot(...point.map((value, axis) =>
    (value + normalMove[axis]) - value));
  TestValidator.predicate("the arrangement separates local norm from rounded net movement",
    !hit.boundary && depth > 0 && roundedTravel > localBudget);
  state.basis.contact!.soft[0].budgetMetres = localBudget;
  const before = JSON.stringify([...state.posed]);
  TestValidator.predicate("actual coordinates cannot exceed the admitted local-vector budget",
    throwsError(() => resolveHumanFaceContact(state.basis, state.basis.contact!, state.posed, state.shaped),
      ["unverified net contact move", "vertex 0", "tissue budget"]));
  TestValidator.equals("actual-budget refusal is transactional", JSON.stringify([...state.posed]), before);
  state.basis.contact!.soft[0].budgetMetres = 0.001;
  const summary = resolveHumanFaceContact(state.basis, state.basis.contact!, state.posed, state.shaped);
  TestValidator.equals("a larger declared fixture budget admits the same ordinary correction", summary[0].vertices, 1);
  TestValidator.predicate("the actual output remains within its declared budget",
    Math.hypot(...point.map((value, axis) => state.posed.get("budget-soft")![axis] - value)) <= 0.001);
};
