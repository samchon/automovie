import {
  integrateAutoMovieRadialField,
  intersectAutoMovieConvexPolygons,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import type { IAutoMoviePatternPoint } from "../../../../packages/engine/src/architecture/IAutoMoviePatternPoint";
import { clipAutoMoviePatternPolygon } from "../../../../packages/engine/src/architecture/clipAutoMoviePatternPolygon";
import { nclose } from "../internal/nclose";

/**
 * Shared planar clipping and compact radial integrals preserve geometry and physical units.
 *
 * Scenarios:
 * 1. Overlapping rectangles have unit area in either clip winding, reversed subjects retain their winding, and the actual pattern adapter agrees. Empty, disjoint and edge-only contacts retain their geometric meanings without duplicate crossing vertices.
 * 2. Full and half unit disks use independent polar/boundary integrals for powers two and three; plane offsets reduce support by q0 and rigid translation/scaling preserve the stated area/gradient units.
 * 3. Two overlapping equal-height sites use an analytic circular-cap integral; coincident sites, site order and the 512-site limit preserve strongest-field rather than additive semantics.
 * 4. Invalid radius, power, sparse/malformed vertices/sites and overflow refuse even for empty fields; failed requests do not mutate borrowed coordinates.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls both public engine operations and the real architecture adapter; observes area, winding, finite vertices, scalar and gradient integrals, work-cap admission and refusal without substituting any method.
 * @evidence contracts/testing.md#independent-expectations Rectangle bounds supply clipping expectations. Polar integration gives pi*r^2*q0^(p+1)/(p+1); Green's boundary integral gives half-disk gradients -16/15 and -32/35. For two sites separated by one radius, integrating the omitted cos^6 circular caps gives 4*pi/9+3*sqrt(3)/10 for power two. Binary64 comparisons allow 1e-10 arithmetic error, not a geometric fitting tolerance.
 * @evidence contracts/testing.md#distinguishing-cases Covers both windings, containment/contact/disjoint/empty inputs, both powers, nonzero plane distance, overlapping versus duplicate sites, dimensional scaling and dense malformed/cap limits. Convexity and well-scaled arithmetic remain documented caller premises; nonconvex integration and directed error certification are not claimed.
 * @evidence contracts/testing.md#execution-ownership Portable test_geometry_planar_field runs pure engine functions and an ordinary coordinate adapter, with no host, image, process, source fixture or GPU.
 */
export function test_geometry_planar_field(): void {
  type Point = [number, number];
  type Site = { x: number; y: number; z: number };
  const subject: Point[] = [
    [0, 0],
    [2, 0],
    [2, 2],
    [0, 2],
  ];
  const boundary: Point[] = [
    [1, 0],
    [3, 0],
    [3, 1],
    [1, 1],
  ];
  const measure: (p: readonly Point[]) => number = (
    p: readonly Point[],
  ): number =>
    p.reduce((s: number, a: Point, i: number): number => {
      const b: Point = p[(i + 1) % p.length]!;
      return s + (a[0] * b[1] - a[1] * b[0]) / 2;
    }, 0);
  for (const clip of [boundary, [...boundary].reverse()]) {
    const result: Point[] = intersectAutoMovieConvexPolygons(subject, clip);
    TestValidator.predicate(
      "unit rectangle and strict crossing vertices",
      nclose(measure(result), 1, 0) &&
        result.length === 4 &&
        result.every(
          (p: Point, i: number): boolean =>
            p[0] >= 1 &&
            p[0] <= 2 &&
            p[1] >= 0 &&
            p[1] <= 1 &&
            (p[0] !== result[(i + 1) % result.length]![0] ||
              p[1] !== result[(i + 1) % result.length]![1]),
        ),
    );
  }
  const reversed: Point[] = intersectAutoMovieConvexPolygons(
    [...subject].reverse(),
    boundary,
  );
  TestValidator.predicate(
    "subject winding survives",
    nclose(measure(reversed), -1, 0),
  );
  const pattern: IAutoMoviePatternPoint[] = clipAutoMoviePatternPolygon(
    subject.map((p: Point): IAutoMoviePatternPoint => ({ u: p[0], v: p[1] })),
    boundary.map((p: Point): IAutoMoviePatternPoint => ({ u: p[0], v: p[1] })),
  );
  TestValidator.predicate(
    "actual pattern adapter uses the same unit intersection",
    nclose(
      measure(pattern.map((p: IAutoMoviePatternPoint): Point => [p.u, p.v])),
      1,
      0,
    ),
  );
  TestValidator.predicate(
    "empty/disjoint/degenerate clipping",
    intersectAutoMovieConvexPolygons([], boundary).length === 0 &&
      intersectAutoMovieConvexPolygons(
        subject,
        boundary.map((p: Point): Point => [p[0] + 4, p[1]]),
      ).length === 0 &&
      intersectAutoMovieConvexPolygons(subject, [
        [0, 0],
        [1, 0],
      ]).length === 0,
  );
  TestValidator.predicate(
    "edge contact has zero area",
    nclose(
      measure(
        intersectAutoMovieConvexPolygons(subject, [
          [2, 0],
          [3, 0],
          [3, 1],
          [2, 1],
        ]),
      ),
      0,
      0,
    ),
  );

  const square: Point[] = [
    [-2, -2],
    [2, -2],
    [2, 2],
    [-2, 2],
  ];
  const half: Point[] = [
    [0, -2],
    [2, -2],
    [2, 2],
    [0, 2],
  ];
  const site: Site = { x: 0, y: 0, z: 0 };
  for (const power of [2, 3] as const) {
    const full: integrateAutoMovieRadialField.IOutput =
      integrateAutoMovieRadialField({
        polygon: square,
        sites: [site],
        radius: 1,
        power,
      });
    const cut: integrateAutoMovieRadialField.IOutput =
      integrateAutoMovieRadialField({
        polygon: half,
        sites: [site],
        radius: 1,
        power,
      });
    const offset: integrateAutoMovieRadialField.IOutput =
      integrateAutoMovieRadialField({
        polygon: square,
        sites: [{ ...site, z: 0.6 }],
        radius: 1,
        power,
      });
    TestValidator.predicate(
      "independent polar integral",
      nclose(full.integral, Math.PI / (power + 1), 1e-10) &&
        full.gradient.every((v: number): boolean => nclose(v, 0, 1e-10)) &&
        nclose(full.area, 16, 0),
    );
    TestValidator.predicate(
      "independent half-disk boundary gradient",
      nclose(cut.integral, Math.PI / (2 * (power + 1)), 1e-10) &&
        nclose(cut.gradient[0], power === 2 ? -16 / 15 : -32 / 35, 1e-10) &&
        nclose(cut.gradient[1], 0, 1e-10),
    );
    TestValidator.predicate(
      "signed plane offset reduces radial support",
      nclose(
        offset.integral,
        (Math.PI * 0.64 ** (power + 1)) / (power + 1),
        1e-10,
      ),
    );
    const scaled: integrateAutoMovieRadialField.IOutput =
      integrateAutoMovieRadialField({
        polygon: half.map((p: Point): Point => [5 + 3 * p[0], -2 + 3 * p[1]]),
        sites: [{ x: 5, y: -2, z: 0 }],
        radius: 3,
        power,
      });
    TestValidator.predicate(
      "common coordinate scale preserves dimensions",
      nclose(scaled.integral, 9 * cut.integral, 1e-10) &&
        nclose(scaled.gradient[0], 3 * cut.gradient[0], 1e-10) &&
        nclose(scaled.area, 9 * cut.area, 1e-10),
    );
  }
  const sites: Site[] = [
    { x: -0.5, y: 0, z: 0 },
    { x: 0.5, y: 0, z: 0 },
  ];
  for (const order of [sites, [...sites].reverse()]) {
    const overlap: integrateAutoMovieRadialField.IOutput =
      integrateAutoMovieRadialField({
        polygon: square,
        sites: order,
        radius: 1,
        power: 2,
      });
    TestValidator.predicate(
      "nearest-site overlapping circular caps",
      nclose(
        overlap.integral,
        (4 * Math.PI) / 9 + (3 * Math.sqrt(3)) / 10,
        1e-10,
      ) && overlap.gradient.every((v: number): boolean => nclose(v, 0, 1e-10)),
    );
  }
  const duplicates: Site[] = Array.from(
    { length: 512 },
    (): Site => ({ ...site }),
  );
  TestValidator.predicate(
    "duplicates remain strongest field at admitted site limit",
    nclose(
      integrateAutoMovieRadialField({
        polygon: square,
        sites: duplicates,
        radius: 1,
        power: 2,
      }).integral,
      Math.PI / 3,
      1e-10,
    ),
  );
  const malformed: Parameters<typeof integrateAutoMovieRadialField>[0][] = [
    { polygon: square, sites: [site], radius: 0, power: 2 },
    { polygon: square, sites: [site], radius: Number.NaN, power: 2 },
    { polygon: square, sites: [site], radius: 1, power: 1 as 2 },
    { polygon: [], sites: new Array<Site>(1), radius: 1, power: 2 },
    { polygon: new Array<Point>(3), sites: [], radius: 1, power: 2 },
    { polygon: [[0] as unknown as Point], sites: [], radius: 1, power: 2 },
    { polygon: square, sites: [...duplicates, site], radius: 1, power: 2 },
    { polygon: square, sites: [site], radius: 1e300, power: 2 },
  ];
  for (const invalid of malformed) {
    let refused: boolean = false;
    try {
      integrateAutoMovieRadialField(invalid);
    } catch {
      refused = true;
    }
    TestValidator.predicate(
      "invalid complete request refuses before zero-domain return",
      refused,
    );
  }
  TestValidator.predicate(
    "source coordinates remain borrowed and unchanged",
    subject.every(
      (p: Point, i: number): boolean =>
        nclose(p[0], [0, 2, 2, 0][i]!, 0) && nclose(p[1], [0, 0, 2, 2][i]!, 0),
    ),
  );
}
