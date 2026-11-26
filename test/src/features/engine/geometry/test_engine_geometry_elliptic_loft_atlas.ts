import { AutoMovieEngineGeometry } from "@automovie/engine";
import type { IAutoMovieEllipticLoft } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

type Input = Parameters<typeof AutoMovieEngineGeometry.createEllipticLoftAtlas>[0];

/**
 * `createAutoMovieEllipticLoftAtlas` turns cubic ellipse profiles into an open
 * bicubic atlas whose patches share their boundary controls, outward facing.
 *
 * Fixture: two 0.05 m spans of the constant ellipse of half axes 0.02 (x) and
 * 0.01 (z), analytic-cylinder domain, tolerance 1e-4. The cubic quarter arc
 * departs from the circle by at most 0.000273 of its radius.
 *
 * Scenarios:
 *
 * 1. Four patches per span; each quarter's last control column is the next
 *    quarter's first, and each first span's last row the second's first.
 * 2. The arc deviation bound is 0.000273 x 0.02.
 * 3. Realized, the mesh completes and qualifies; every vertex lies on the ellipse
 *    within that bound, between y 0 and 0.1 (no cap), its normal outward.
 * 4. The second span's x radius rising (0.02, 0.025, 0.025, 0.03) creases the seam
 *    at y = 0.05: at (0.02, 0.05, 0) both normal limits appear (y components 0
 *    and below -0.1).
 * 5. A zero radius control, a gap between spans, a reversed interval, unequal z
 *    radii at the seam and a zero vertex budget are refused; one cell of budget
 *    realizes incomplete.
 */
export function test_engine_geometry_elliptic_loft_atlas(): void {
  const make = (): Input => ({
    loft: {
      spans: [0, 1].map(
        (i: number): IAutoMovieEllipticLoft["spans"][number] => ({
          interval: [i * 0.05, (i + 1) * 0.05],
          radiusX: [0.02, 0.02, 0.02, 0.02],
          radiusZ: [0.01, 0.01, 0.01, 0.01],
          centreX: [0, 0, 0, 0],
          centreZ: [0, 0, 0, 0],
        }),
      ),
    },
    topologyDomain: "analytic-cylinder",
    tolerance: 0.0001,
    maxCells: 20_000,
    maxVertices: 30_000,
  });
  const result: ReturnType<typeof AutoMovieEngineGeometry.createEllipticLoftAtlas> =
    AutoMovieEngineGeometry.createEllipticLoftAtlas(make());
  const patches = result.geometry.patches;

  // 1.
  TestValidator.equals("patches", patches.length, 8);
  for (let span: number = 0; span < 2; span++)
    for (let q: number = 0; q < 4; q++)
      for (let row: number = 0; row < 4; row++)
        TestValidator.equals(
          `angular ${span}/${q}/${row}`,
          patches[4 * span + q]!.controlIds[4 * row + 3],
          patches[4 * span + ((q + 1) % 4)]!.controlIds[4 * row],
        );
  for (let q: number = 0; q < 4; q++)
    for (let column: number = 0; column < 4; column++)
      TestValidator.equals(
        `axial ${q}/${column}`,
        patches[q]!.controlIds[12 + column],
        patches[4 + q]!.controlIds[column],
      );

  // 2.
  TestValidator.predicate(
    "arc bound",
    Math.abs(result.arcDeviationBound - 0.000273 * 0.02) <= 1e-15,
  );

  // 3.
  const actual: ReturnType<typeof AutoMovieEngineGeometry.realizeBicubicAtlas64> =
    AutoMovieEngineGeometry.realizeBicubicAtlas64(result.geometry);
  TestValidator.predicate(
    "complete",
    actual.complete &&
      actual.approximationQualified &&
      actual.mesh.positions.length > 0,
  );
  const p: number[] = actual.mesh.positions;
  const n: number[] = actual.mesh.normals ?? [];
  TestValidator.equals("normals", n.length, p.length);
  for (let i: number = 0; i < p.length; i += 3) {
    TestValidator.predicate(
      `on the ellipse ${i}`,
      Math.abs(Math.hypot(p[i]! / 0.02, p[i + 2]! / 0.01) - 1) <=
        0.000273 + 1e-12,
    );
    TestValidator.predicate(
      `no cap ${i}`,
      p[i + 1]! >= -1e-14 && p[i + 1]! <= 0.1 + 1e-14,
    );
    TestValidator.predicate(
      `outward ${i}`,
      p[i]! * n[i]! + p[i + 2]! * n[i + 2]! > 0,
    );
  }

  // 4.
  const crease: Input = make();
  crease.loft.spans[1]!.radiusX = [0.02, 0.025, 0.025, 0.03];
  const joined: ReturnType<typeof AutoMovieEngineGeometry.realizeBicubicAtlas64> =
    AutoMovieEngineGeometry.realizeBicubicAtlas64(
      AutoMovieEngineGeometry.createEllipticLoftAtlas(crease).geometry,
    );
  const jp: number[] = joined.mesh.positions;
  const limits: number[] = [];
  for (let i: number = 0; i < jp.length; i += 3)
    if (
      Math.abs(jp[i]! - 0.02) <= 1e-12 &&
      Math.abs(jp[i + 1]! - 0.05) <= 1e-12 &&
      Math.abs(jp[i + 2]!) <= 1e-12
    )
      limits.push(joined.mesh.normals![i + 1]!);
  TestValidator.predicate(
    "both limits",
    limits.some((y: number): boolean => Math.abs(y) < 1e-12) &&
      limits.some((y: number): boolean => y < -0.1),
  );

  // 5.
  const variants: [string, (input: Input) => void][] = [
    ["zero radius", (i) => void (i.loft.spans[0]!.radiusX[1] = 0)],
    ["gap", (i) => void (i.loft.spans[1]!.interval[0] += 0.001)],
    ["reversed", (i) => void i.loft.spans[0]!.interval.reverse()],
    ["unequal seam", (i) => void (i.loft.spans[1]!.radiusZ[0] += 0.001)],
    ["zero budget", (i) => void (i.maxVertices = 0)],
  ];
  for (const [label, edit] of variants) {
    const input: Input = make();
    edit(input);
    TestValidator.predicate(
      label,
      throwsError((): unknown => AutoMovieEngineGeometry.createEllipticLoftAtlas(input)),
    );
  }
  TestValidator.equals(
    "one cell",
    AutoMovieEngineGeometry.realizeBicubicAtlas64({ ...result.geometry, maxCells: 1 })
      .complete,
    false,
  );
}
