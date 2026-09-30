import { measureHumanBodySpheresSkinClearance } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Exact analytic box geometry pins sphere-to-skin distance, containment and
 * the actual cap over an open collar boundary.
 *
 * Scenarios:
 * 1. A centre inside the 0.2 x 2 x 0.4 m box has 0.1 m to its nearest
 *    side; a 0.05 m head has 0.05 m room and one shifted 0.05 m touches.
 * 2. Protruding, outside-face, edge and corner centres carry the signed
 *    Euclidean gap, never a face-plane extension as their nearest point.
 * 3. Removing the top face makes its actual ring cap the nearest boundary.
 * 4. Bad radii/centres, absent skin and overlapping solid interiors refuse.
 */
export const test_human_body_spheres_skin_clearance = (): void => {
  const surface = humanBodyBasisFixture().basis.surfaces[0];
  const skin = { positions: surface.positions, indices: surface.indices };
  const sphere = (
    id: string,
    x: number,
    y: number,
    z: number,
    radiusMetres: number,
  ) => ({
    id,
    center: { x, y, z },
    radiusMetres,
  });
  const read = (...spheres: ReturnType<typeof sphere>[]) =>
    measureHumanBodySpheresSkinClearance({ skins: [skin], spheres });
  const [inside, touch, protruding] = read(
    sphere("inside", 0, 1, 0, 0.05),
    sphere("touch", 0.05, 1, 0, 0.05),
    sphere("protruding", 0.075, 1, 0, 0.05),
  );
  TestValidator.predicate(
    "inside head room",
    inside.centerInside && nclose(inside.clearanceMetres, 0.05),
  );
  TestValidator.predicate(
    "exact contact",
    touch.centerInside && nclose(touch.clearanceMetres, 0),
  );
  TestValidator.predicate(
    "protruding head",
    protruding.centerInside && nclose(protruding.clearanceMetres, -0.025),
  );
  const [face, edge, corner] = read(
    sphere("face", 0.15, 1, 0, 0.01),
    sphere("edge", 0.15, 1, 0.25, 0.01),
    sphere("corner", 0.15, 2.05, 0.25, 0.01),
  );
  TestValidator.predicate(
    "outside face",
    !face.centerInside && nclose(face.nearestMetres, 0.05),
  );
  TestValidator.predicate(
    "outside edge",
    !edge.centerInside && nclose(edge.nearestMetres, Math.hypot(0.05, 0.05)),
  );
  TestValidator.predicate(
    "outside corner",
    !corner.centerInside &&
      nclose(corner.nearestMetres, Math.hypot(0.05, 0.05, 0.05)),
  );
  const open = {
    positions: skin.positions,
    indices: [...skin.indices.slice(0, 24), ...skin.indices.slice(30)],
  };
  const capped = measureHumanBodySpheresSkinClearance({
    skins: [open],
    spheres: [sphere("cap", 0, 1.95, 0, 0.02)],
  })[0];
  TestValidator.predicate(
    "actual open-ring cap",
    capped.centerInside && nclose(capped.clearanceMetres, 0.03),
  );
  TestValidator.predicate(
    "empty skins refuse",
    throwsError(() =>
      measureHumanBodySpheresSkinClearance({ skins: [], spheres: [] }),
    ),
  );
  TestValidator.predicate(
    "nonpositive radius refuses",
    throwsError(() => read(sphere("r", 0, 1, 0, 0))),
  );
  TestValidator.predicate(
    "nonfinite centre refuses",
    throwsError(() => read(sphere("c", NaN, 1, 0, 0.01))),
  );
  TestValidator.predicate(
    "empty identity refuses",
    throwsError(() => read(sphere("", 0, 1, 0, 0.01))),
  );
  const collapsed = { positions: [...skin.positions], indices: skin.indices };
  collapsed.positions.splice(
    5 * 3,
    3,
    ...collapsed.positions.slice(4 * 3, 4 * 3 + 3),
  );
  TestValidator.predicate(
    "zero-area skin refuses",
    throwsError(() =>
      measureHumanBodySpheresSkinClearance({
        skins: [collapsed],
        spheres: [sphere("head", 0, 1, 0, 0.01)],
      }),
    ),
  );
  TestValidator.predicate(
    "overlapping interiors refuse",
    throwsError(() =>
      measureHumanBodySpheresSkinClearance({
        skins: [skin, skin],
        spheres: [sphere("double", 0, 1, 0, 0.01)],
      }),
    ),
  );
};
