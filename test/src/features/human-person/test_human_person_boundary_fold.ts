import { type IAutoMovieHumanPersonSeam, stitchHumanPersonBoundary } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * A replacement boundary can cross a triangle's interior edge before packing.
 *
 * All coordinates are dyadic and survive Float32 exactly. In the original
 * triangle's XY plane, A→D→B crosses C→A: neither a centroid fan nor either
 * quadrilateral diagonal gives only faces agreeing with the original winding.
 * The oracle uses scalar planar determinants independently of the production
 * triangle-area implementation. This pins the geometry class observed in the
 * published head-turn body refusal, without importing that subject's basis.
 *
 * Scenarios:
 * 1. A dyadic boundary crosses a retained interior edge; the scalar planar
 *    oracle shows that the old-centroid fan and both diagonals change direction.
 * 2. The boundary survives Float32 exactly, separating a geometry fold from
 *    quantization, and the crossing falls strictly inside both segments.
 * 3. The same typed mesh and ordered loop enter the production boundary owner;
 *    its strict body-side refusal identifies the geometric admission condition.
 */
export const test_human_person_boundary_fold = (): void => {
  const r = 1 / 32;
  const a = [0, 0, r];
  const b = [r, 0, r];
  const c = [0, -r, r];
  const d = [-r / 8, -r / 16, r];
  const centre = [r / 3, -r / 3, r];
  const area = (p: number[], q: number[], s: number[]): number =>
    (q[0] - p[0]) * (s[1] - p[1]) -
    (q[1] - p[1]) * (s[0] - p[0]);
  const original = area(a, b, c);
  TestValidator.predicate("the preserved-centroid fan changes direction before precision conversion", original * area(centre, a, d) < 0);
  TestValidator.predicate("both quadrilateral diagonals contain an oppositely oriented face", original * area(a, d, c) < 0 && original * area(a, d, b) < 0);
  TestValidator.equals("the replacement boundary is already exactly Float32 representable", [...a, ...b, ...c, ...d].map(Math.fround), [...a, ...b, ...c, ...d]);
  // D→B reaches x=0 at 1/9 of its length, inside C→A at y=-r/18.
  TestValidator.equals("the boundary crosses the retained interior edge", d[0] + (b[0] - d[0]) / 9, 0);
  TestValidator.predicate("the crossing lies within both segments", -r / 18 > c[1] && -r / 18 < a[1]);
  const seam: IAutoMovieHumanPersonSeam = {
    faceBasis: "analytic-face", bodyBasis: "analytic-body",
    faceSurface: "face", bodySurface: "body", axis: { x: 0, z: 0 },
    faceLoop: [0, 1, 2, 3], bodyLoop: [0, 1, 2, 3], covered: [], ribbon: [],
    collar: {
      reachMetres: r, headReachMetres: r, band: [],
      follow: [{ edge: 0, fraction: 0 }, { edge: 2, fraction: 0 }, { edge: 1, fraction: 0 }, { edge: 0, fraction: 0.5 }],
    },
  };
  TestValidator.predicate("the production owner refuses the same crossing perimeter", throwsError(() => stitchHumanPersonBoundary({
    mesh: { positions: [...a, ...b, ...c], indices: [0, 1, 2], normals: null, uvs: null, skin: null },
    sources: [0, 1, 4], side: "body", seam,
    face: [...a, 0, 0, -r, ...b, ...d],
    faceNormals: [0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1],
  }), "Side=body"));
};
