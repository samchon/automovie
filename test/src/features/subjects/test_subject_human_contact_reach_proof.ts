import { resolveHumanFaceContact } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceContactPlaneFixture as fixture } from "../internal/humanFaceContactPlaneFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * A floor is proven where its sheet can no longer be read when the move is
 * shorter than the original outside reading, and refuses otherwise. The
 * distance to a surface is 1-Lipschitz, so a point that started s outside and
 * moved less than s has not crossed the surface and keeps at least s minus its
 * travel of clearance, however far the sheet's reach is passed.
 *
 * Scenarios:
 * 1. The 0.8 mm correction to x = 0 by the plane x = 0 leaves a second plane
 *    that started 0.9 mm behind it and reads only within 1.1 mm. The point ends
 *    1.7 mm out of reach, but 0.9 - 0.8 = 0.1 mm of clearance is proven, so
 *    the correction is accepted with the point exactly on x = 0.
 * 2. The twin starts 0.7 mm outside the second plane. The move is longer than
 *    that reading, so a crossing cannot be excluded: refusal, and every pose
 *    buffer keeps its original values.
 */
export const test_subject_human_contact_reach_proof = (): void => {
  const arranged = (offset: number) => {
    const state = fixture([[1, 0, 0], [1, 0, 0]], [-0.0008, 0, 0], 0.001);
    state.basis.contact!.colliders[1].reachMetres = 0.0011;
    for (let at = 0; at < 9; at += 3) {
      state.posed.get("budget-plane-1")![at] = -0.0008 - offset;
      state.shaped.get("budget-plane-1")![at] = 0.0006;
    }
    return state;
  };

  const proven = arranged(0.0009);
  resolveHumanFaceContact(proven.basis, proven.basis.contact!, proven.posed, proven.shaped);
  TestValidator.predicate("a move shorter than the outside reading is proven and accepted",
    nclose(proven.posed.get("budget-soft")![0], 0, 1e-12));

  const crossing = arranged(0.0007);
  const before = JSON.stringify([...crossing.posed]);
  TestValidator.predicate("a move longer than the outside reading cannot be proven",
    throwsError(() => resolveHumanFaceContact(crossing.basis, crossing.basis.contact!,
      crossing.posed, crossing.shaped), ["contact floor cannot be verified", "vertex 0"]));
  TestValidator.equals("refusal preserves every pose buffer", JSON.stringify([...crossing.posed]), before);
};
