import { assertHumanFaceBasis, resolveHumanFaceContact } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceContactPlaneFixture as fixture } from "../internal/humanFaceContactPlaneFixture";
import { throwsError } from "../internal/predicates";

/**
 * Contact publishes all soft surfaces together after their signed witnesses
 * pass. Staging a valid earlier surface cannot mutate caller data before a
 * later surface refuses.
 *
 * Scenarios:
 * 1. The first surface requires an ordinary 0.8 mm correction. A translated
 *    second surface loses a separate short-reach collider after that same
 *    correction; refusal preserves every original buffer, including the first.
 * 2. Enlarging only that second query's reach verifies both surfaces. Their
 *    existing output arrays receive the results together and retain identity.
 */
export const test_subject_human_contact_transaction = (): void => {
  const state = fixture([[1, 0, 0], [1, 0, 0]], [-0.0008, 0, 0], 0.001);
  const firstPlane = state.basis.surfaces.find((one) => one.id === "budget-plane-0")!;
  for (let at = 1; at < 9; at += 3) {
    firstPlane.positions[at] *= 10;
    state.shaped.get(firstPlane.id)![at] *= 10;
    state.posed.get(firstPlane.id)![at] *= 10;
  }
  const otherPlane = state.basis.surfaces.find((one) => one.id === "budget-plane-1")!;
  for (let at = 0; at < 9; at += 3) {
    otherPlane.positions[at] = 0.0006;
    otherPlane.positions[at + 1] += 0.3;
    state.shaped.get(otherPlane.id)![at] = 0.0006;
    state.shaped.get(otherPlane.id)![at + 1] += 0.3;
    state.posed.get(otherPlane.id)![at] = -0.001;
    state.posed.get(otherPlane.id)![at + 1] += 0.3;
  }
  state.basis.contact!.colliders[1].reachMetres = 0.0005;
  const second = structuredClone(state.basis.surfaces.find((one) => one.id === "budget-soft")!);
  second.id = "later-soft";
  second.regions[0].id = "later-soft/all";
  for (let at = 1; at < second.positions.length; at += 3)
    second.positions[at] += 0.3;
  state.basis.surfaces.push(second);
  state.shaped.set(second.id, [...second.positions]);
  const later = [...second.positions];
  later.splice(0, 3, -0.0008, 0.3, 0);
  state.posed.set(second.id, later);
  state.basis.contact!.soft.push({ surface: second.id, budgetMetres: 0.001 });
  assertHumanFaceBasis(state.basis);
  const original = JSON.stringify([...state.posed]);
  const buffers = [...state.posed.values()];
  TestValidator.predicate("a later refusal identifies its own surface",
    throwsError(() => resolveHumanFaceContact(state.basis, state.basis.contact!, state.posed, state.shaped),
      ["later-soft", "contact floor cannot be verified", "vertex 0"]));
  TestValidator.equals("later refusal preserves the earlier staged correction", JSON.stringify([...state.posed]), original);
  TestValidator.predicate("later refusal retains all buffer identities",
    [...state.posed.values()].every((one, index) => one === buffers[index]));
  state.basis.contact!.colliders[1].reachMetres = 0.0011;
  const summary = resolveHumanFaceContact(state.basis, state.basis.contact!, state.posed, state.shaped);
  TestValidator.equals("both valid surfaces are committed", summary.map((one) => one.vertices), [1, 1]);
  TestValidator.predicate("both first points attain their known x floor",
    state.posed.get("budget-soft")![0] === 0 && state.posed.get("later-soft")![0] === 0);
  TestValidator.predicate("success retains all buffer identities",
    [...state.posed.values()].every((one, index) => one === buffers[index]));
};
