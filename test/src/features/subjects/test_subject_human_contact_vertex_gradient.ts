import { assertHumanFaceBasis, resolveHumanFaceContact } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceContactPlaneFixture as fixture } from "../internal/humanFaceContactPlaneFixture";
import { nclose } from "../internal/predicates";

/**
 * A floor whose nearest collider feature is a vertex is a floor along the
 * radial direction, not along that vertex's pseudonormal. Clearance from a
 * point grows at unit rate along the unit vector away from it, and grows more
 * slowly along any other direction by the cosine between them; a correction
 * measured along the pseudonormal falls short of the floor by the lost fraction.
 *
 * Scenarios:
 * 1. A four-sided open pyramid roof with its apex at the origin (apex
 *    pseudonormal +X by symmetry) holds a soft vertex 2 mm from the apex along
 *    d = (2, 0.6, 0.3)/|.|, inside the apex's normal region (at x = 2, the diamond |y|+|z| < 1
 *    spanned by the face normals (2, 0, +-1) and (2, +-1, 0)), 18.5 degrees
 *    off the pseudonormal. Its rest
 *    clearance is 20 mm and the cover 10 mm, so the floor is 10 mm and the
 *    excess 8 mm. The oracle is Euclidean: the corrected point must lie at 10
 *    mm from the apex along d, a travel of 8 mm, with no refusal.
 * 2. The pseudonormal reading of the same floor would move 8 mm along +X and
 *    end 9.914 mm from the apex, 0.086 mm below the floor and past the
 *    0.05 mm tolerance, which is what the radial row prevents.
 */
export const test_subject_human_contact_vertex_gradient = (): void => {
  const length = Math.hypot(2, 0.6, 0.3);
  const direction = [2 / length, 0.6 / length, 0.3 / length];
  const scaled = (metres: number): number[] => direction.map((value) => metres * value);
  const state = fixture([[1, 0, 0]], scaled(0.002), 0.02);
  const roof = state.basis.surfaces.find((one) => one.id === "budget-plane-0")!;
  roof.positions = [
    0, 0, 0,
    -0.05, 0.1, 0.1, -0.05, -0.1, 0.1, -0.05, -0.1, -0.1, -0.05, 0.1, -0.1,
  ];
  roof.indices = [0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 1];
  roof.regions = [{ id: "budget-plane-0/all", material: "skin", indices: roof.indices, uvs: null }];
  state.basis.contact!.colliders[0].coverMetres = 0.01;
  assertHumanFaceBasis(state.basis);
  state.posed.set(roof.id, [...roof.positions]);
  state.shaped.set(roof.id, [...roof.positions]);
  state.shaped.get("budget-soft")!.splice(0, 3, ...scaled(0.02));

  resolveHumanFaceContact(state.basis, state.basis.contact!, state.posed, state.shaped);
  const at = state.posed.get("budget-soft")!.slice(0, 3);
  TestValidator.predicate("the corrected point is the floor distance from the apex",
    nclose(Math.hypot(...at), 0.01, 1e-12));
  TestValidator.predicate("the correction runs along the radial direction",
    at.every((value, axis) => nclose(value, 0.01 * direction[axis], 1e-12)));
  TestValidator.predicate("the travel is the 8 mm excess",
    nclose(Math.hypot(...at.map((value, axis) => value - 0.002 * direction[axis])), 0.008, 1e-12));
  const alongPseudonormal = Math.hypot(0.002 * direction[0] + 0.008, 0.002 * direction[1], 0.002 * direction[2]);
  TestValidator.predicate("the pseudonormal reading would end past the tolerance short",
    0.01 - alongPseudonormal > state.basis.contact!.toleranceMetres);
};
