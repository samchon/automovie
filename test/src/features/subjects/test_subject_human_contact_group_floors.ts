import { assertHumanFaceBasis, resolveHumanFaceContact } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceContactPlaneFixture as fixture } from "../internal/humanFaceContactPlaneFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * A coincident posed group retains the original rest floor of every member.
 * Posed coincidence alone does not imply equal shaped clearance; the shared
 * correction must obey the strongest known floor without opening the group.
 *
 * Scenarios:
 * 1. Shaped members at x=-0.5 mm and +0.5 mm coincide at posed x=-0.8 mm.
 *    Their floors are -0.5 mm and zero. Budget 1 mm admits the 0.8 mm move
 *    required by the second member, and the summary retains that initial depth.
 * 2. Budget 0.5 mm refuses that same group's 0.8 mm requirement, preserving
 *    every original caller buffer rather than accepting the first member alone.
 * 3. The representative's shaped point lies beyond query reach, while another
 *    coincident member has a known zero floor. That known member still corrects
 *    the whole posed group, rather than losing its original collider witness.
 */
export const test_subject_human_contact_group_floors = (): void => {
  for (const budget of [0.001, 0.0005]) {
    const state = fixture([[1, 0, 0]], [-0.0008, 0, 0], budget);
    const surface = state.basis.surfaces.find((one) => one.id === "budget-soft")!;
    surface.positions.splice(0, 6, -0.0005, 0, 0, 0.0005, 0.01, 0);
    state.shaped.get(surface.id)!.splice(0, 6, ...surface.positions.slice(0, 6));
    state.posed.get(surface.id)!.splice(3, 3, -0.0008, 0, 0);
    assertHumanFaceBasis(state.basis);
    const before = JSON.stringify([...state.posed]);
    if (budget === 0.001) {
      const summary = resolveHumanFaceContact(state.basis, state.basis.contact!, state.posed, state.shaped);
      const result = state.posed.get(surface.id)!;
      TestValidator.predicate("every group member's original rest floor is retained",
        nclose(result[0], 0, 1e-12) && nclose(result[3], 0, 1e-12));
      TestValidator.equals("one coincident group is counted", summary[0].vertices, 1);
      TestValidator.predicate("summary retains the strongest original member depth",
        nclose(summary[0].maxDepthMetres, 0.0008, 1e-12));
    } else {
      TestValidator.predicate("a stricter member floor cannot escape its movement budget",
        throwsError(() => resolveHumanFaceContact(state.basis, state.basis.contact!, state.posed, state.shaped),
          ["budget-soft", "vertex 0", "0.80 mm", "0.50 mm tissue budget"]));
      TestValidator.equals("group-floor refusal preserves all supplied poses", JSON.stringify([...state.posed]), before);
    }
  }
  const unknown = fixture([[1, 0, 0]], [-0.0008, 0, 0], 0.001);
  const mixed = unknown.basis.surfaces.find((one) => one.id === "budget-soft")!;
  mixed.positions.splice(0, 6, 0.3, 0, 0, 0.0005, 0.01, 0);
  unknown.shaped.get(mixed.id)!.splice(0, 6, ...mixed.positions.slice(0, 6));
  unknown.posed.get(mixed.id)!.splice(3, 3, -0.0008, 0, 0);
  assertHumanFaceBasis(unknown.basis);
  const knownSummary = resolveHumanFaceContact(unknown.basis, unknown.basis.contact!, unknown.posed, unknown.shaped);
  TestValidator.predicate("a known member keeps its witness despite an unknown representative",
    nclose(unknown.posed.get(mixed.id)![0], 0, 1e-12) && knownSummary[0].vertices === 1);
};
