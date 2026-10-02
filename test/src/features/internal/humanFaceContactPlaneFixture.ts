import { assertHumanFaceBasis } from "@automovie/human";

import { humanFaceContactFixture } from "./humanFaceContactFixture";

/**
 * Admitted metre-frame contact input with independent unit-normal triangles.
 * The full oral fixture retains valid articulation, channels and apertures;
 * its contact surfaces are replaced with planar analytic witnesses. Normals
 * must be unit vectors transverse to Z, so cross(normal,Z) defines the first
 * tangent and cross(normal,tangent) defines the second. The triangle winding
 * then has the supplied normal. Only the first soft vertex is posed; its
 * two remote neighbours exercise the actual one-ring consumer.
 *
 * The returned arrays are independent owned buffers. Tests may translate a
 * collider or replace a soft surface before re-admitting the modified basis.
 */
export const humanFaceContactPlaneFixture = (
  normals: number[][],
  point: number[],
  budget: number,
) => {
  const { basis } = humanFaceContactFixture();
  const cross = (a: number[], b: number[]) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
  const surface = (id: string, positions: number[]) => ({
    id,
    positions,
    indices: [0, 1, 2],
    targets: {},
    regions: [{ id: id + "/all", material: "skin", indices: [0, 1, 2], uvs: null }],
  });
  normals.forEach((normal, index) => {
    const raw = cross(normal, [0, 0, 1]);
    const u = raw.map((value) => value / Math.hypot(...raw));
    const v = cross(normal, u);
    basis.surfaces.push(surface("budget-plane-" + index, [
      ...u.map((value, axis) => -0.1 * value - 0.1 * v[axis]),
      ...u.map((value, axis) => 0.1 * value - 0.1 * v[axis]),
      ...v.map((value) => 0.1 * value),
    ]));
  });
  basis.surfaces.push(surface("budget-soft", [
    ...point.map((value) => -value), 0.3, 0.3, 0.3, 0.4, 0.3, 0.3,
  ]));
  basis.contact!.colliders = normals.map((_, index) => ({
    surface: "budget-plane-" + index,
    closure: [],
    reachMetres: 0.05,
    coverMetres: 0,
  }));
  basis.contact!.soft = [{ surface: "budget-soft", budgetMetres: budget }];
  assertHumanFaceBasis(basis);
  const shaped = new Map(basis.surfaces.map((one) => [one.id, [...one.positions]]));
  const posed = new Map(basis.surfaces.map((one) => [one.id, [...one.positions]]));
  posed.get("budget-soft")!.splice(0, 3, ...point);
  return { basis, shaped, posed, point, budget };
};
