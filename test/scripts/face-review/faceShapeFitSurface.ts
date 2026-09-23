/**
 * Landmark anchors on a connected basis surface, and their positions in any
 * built document.
 *
 * `fit-face-landmarks.ts` anchors the detector's 478 landmarks once on the
 * shared neutral: each landmark pixel of a neutral render is cast back along
 * its capture ray (`faceShapeFitCamera.ts`) onto the surface, and the nearest
 * hit is stored as three basis vertex ids and barycentric weights. The same
 * anchors then give the landmark's position on every document's built
 * surface, because every document shares the basis topology. An anchor is
 * therefore shared construction data, like any basis correspondence, and
 * never a person's coordinate.
 *
 * `faceShapeFitSurfacePositions` recovers a basis surface's evaluated vertex
 * positions from a built model: every region part gathers the surface's
 * vertices in the fixed order `createHumanFaceBasisRegion` compiles, so
 * evaluating the same region on vertex-index "positions" returns that order.
 * Posing, articulation and contact are thereby included exactly as the
 * renderer receives them. Pure: inputs are read, new arrays are returned.
 */
import {
  type IAutoMovieHumanFaceBasis,
  createHumanFaceBasisRegion,
} from "@automovie/human";
import type { IAutoMovieModel } from "@automovie/interface";

/** A landmark bound to one surface triangle by barycentric weights. */
export interface IFaceShapeFitAnchor {
  vertices: [number, number, number];
  weights: [number, number, number];
}

/** A basis surface's vertex positions as they stand in a built model. */
export function faceShapeFitSurfacePositions(
  basis: IAutoMovieHumanFaceBasis,
  model: IAutoMovieModel,
  surfaceId: string,
): number[] {
  const surface = basis.surfaces.find((one) => one.id === surfaceId);
  if (surface === undefined)
    throw new Error("No basis surface " + surfaceId + ".");
  const count = surface.positions.length / 3;
  const identity = Array.from({ length: count * 3 }, (_, k) =>
    k % 3 === 0 ? k / 3 : 0,
  );
  const positions = new Array<number>(count * 3).fill(Number.NaN);
  for (const region of surface.regions) {
    const sources = createHumanFaceBasisRegion(region)(
      identity,
      identity,
    ).positions;
    const part = model.parts.find((one) => one.id === region.id);
    if (part === undefined || part.geometry.type !== "mesh")
      throw new Error("The model lacks the region " + region.id + ".");
    const built = part.geometry.mesh.positions;
    for (let i = 0; i < sources.length / 3; ++i)
      for (let axis = 0; axis < 3; ++axis)
        positions[3 * sources[3 * i]! + axis] = built[3 * i + axis]!;
  }
  return positions;
}

/**
 * Nearest intersection of a ray with a triangle mesh (Moller-Trumbore),
 * both triangle faces counted, or null when the ray misses.
 */
export function raycastFaceShapeFitSurface(
  positions: readonly number[],
  indices: readonly number[],
  ray: { origin: readonly number[]; direction: readonly number[] },
): (IFaceShapeFitAnchor & { distance: number }) | null {
  let best: (IFaceShapeFitAnchor & { distance: number }) | null = null;
  const o = ray.origin;
  const d = ray.direction;
  for (let t = 0; t < indices.length; t += 3) {
    const [a, b, c] = [indices[t]!, indices[t + 1]!, indices[t + 2]!];
    const p = (v: number, k: number) => positions[3 * v + k]!;
    const e1 = [0, 1, 2].map((k) => p(b, k) - p(a, k));
    const e2 = [0, 1, 2].map((k) => p(c, k) - p(a, k));
    const h = cross(d, e2);
    const det = dot(e1, h);
    if (Math.abs(det) < 1e-18) continue;
    const s = [0, 1, 2].map((k) => o[k]! - p(a, k));
    const u = dot(s, h) / det;
    if (u < 0 || u > 1) continue;
    const q = cross(s, e1);
    const v = dot(d, q) / det;
    if (v < 0 || u + v > 1) continue;
    const distance = dot(e2, q) / det;
    if (distance <= 0 || (best !== null && distance >= best.distance)) continue;
    best = { vertices: [a, b, c], weights: [1 - u - v, u, v], distance };
  }
  return best;
}

/** The anchored point on a surface's positions. */
export function faceShapeFitAnchorPoint(
  positions: readonly number[],
  anchor: IFaceShapeFitAnchor,
): [number, number, number] {
  return [0, 1, 2].map((axis) =>
    anchor.vertices.reduce(
      (sum, vertex, k) =>
        sum + anchor.weights[k]! * positions[3 * vertex + axis]!,
      0,
    ),
  ) as [number, number, number];
}

function dot(a: readonly number[], b: readonly number[]): number {
  return a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
}

function cross(a: readonly number[], b: readonly number[]): number[] {
  return [
    a[1]! * b[2]! - a[2]! * b[1]!,
    a[2]! * b[0]! - a[0]! * b[2]!,
    a[0]! * b[1]! - a[1]! * b[0]!,
  ];
}
