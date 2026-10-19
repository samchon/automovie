import { createAutoMovieEllipticLoftAtlas } from "@automovie/engine/geometry/createAutoMovieEllipticLoftAtlas";
import { realizeAutoMovieBicubicAtlas64 } from "@automovie/engine/geometry/realizeAutoMovieBicubicAtlas64";
import type { IAutoMovieEllipticLoft } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * Generic cubic ellipse profiles form shared outward-facing open atlas surfaces.
 *
 * Scenarios:
 * 1. Two constant-profile spans share both angular and axial coefficient owners.
 * 2. Actual engine vertices and normals agree with an independent ellipse cylinder.
 * 3. Positive controls, physical ordering and exact C0 ownership are required; C0 creases retain both analytic normal limits.
 * 4. Explicit tessellation exhaustion stays distinct from finite recipe construction.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs the public loft producer and actual atlas realization and asserts shared output coefficient indices, emitted geometric fidelity, outward normals and refusal/incomplete outcomes.
 * @evidence contracts/testing.md#independent-expectations The cylinder satisfies (x/0.02)^2+(z/0.01)^2=1 with positive outward radial normals and open Y ends. The standard cubic circle deviation is bounded independently by the producer's documented 0.000273 relative bound; endpoint identity is mandated by the public shared-atlas contract.
 * @evidence contracts/testing.md#distinguishing-cases Covers two spans, angular wrap, axial seam, distinct one-sided C0 normals, constant positive radii, zero radius, interval gap/reversal, unequal boundary coefficients, sparse control arrays, invalid budgets and deliberately incomplete tessellation. Image inference and semantic edits belong to recovery tests.
 * @evidence contracts/testing.md#execution-ownership The portable test_geometry_elliptic_loft_atlas entry generates a bounded numerical CPU mesh from analytic coefficients, without a real host, native build, browser, GPU or Human source.
 */
export function test_geometry_elliptic_loft_atlas(): void {
  const make: () => Parameters<
    typeof createAutoMovieEllipticLoftAtlas
  >[0] = (): Parameters<typeof createAutoMovieEllipticLoftAtlas>[0] => ({
    loft: {
      spans: [0, 1].map(
        (index: number): IAutoMovieEllipticLoft["spans"][number] => ({
          interval: [index * 0.05, (index + 1) * 0.05],
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
  const result: ReturnType<typeof createAutoMovieEllipticLoftAtlas> =
    createAutoMovieEllipticLoftAtlas(make());
  TestValidator.equals(
    "four patches per physical span",
    result.geometry.patches.length,
    8,
  );
  for (let span: number = 0; span < 2; span++)
    for (let quarter: number = 0; quarter < 4; quarter++)
      for (let row: number = 0; row < 4; row++)
        TestValidator.equals(
          "angular boundary identity",
          result.geometry.patches[4 * span + quarter].controlIds[4 * row + 3],
          result.geometry.patches[4 * span + ((quarter + 1) % 4)].controlIds[
            4 * row
          ],
        );
  for (let quarter: number = 0; quarter < 4; quarter++)
    for (let column: number = 0; column < 4; column++)
      TestValidator.equals(
        "axial boundary identity",
        result.geometry.patches[quarter].controlIds[12 + column],
        result.geometry.patches[4 + quarter].controlIds[column],
      );
  TestValidator.predicate(
    "explicit circular approximation bound",
    nclose(result.arcDeviationBound, 0.000273 * 0.02, 1e-15),
  );
  const actual: ReturnType<typeof realizeAutoMovieBicubicAtlas64> =
    realizeAutoMovieBicubicAtlas64(result.geometry);
  TestValidator.predicate(
    "bounded cylinder realization completes",
    actual.complete &&
      actual.approximationQualified &&
      actual.mesh.positions.length > 0,
  );
  if (actual.mesh.normals === null)
    throw new Error("Expected independently generated normals");
  for (
    let index: number = 0;
    index < actual.mesh.positions.length;
    index += 3
  ) {
    const x: number = actual.mesh.positions[index],
      y: number = actual.mesh.positions[index + 1],
      z: number = actual.mesh.positions[index + 2];
    TestValidator.predicate(
      "cubic cylinder matches analytic cross section",
      Math.abs(Math.hypot(x / 0.02, z / 0.01) - 1) <= 0.000273 + 1e-12,
    );
    TestValidator.predicate(
      "no cap or extrapolated extent",
      y >= -1e-14 && y <= 0.1 + 1e-14,
    );
    TestValidator.predicate(
      "analytic atlas normals face outward",
      x * actual.mesh.normals[index] + z * actual.mesh.normals[index + 2] > 0,
    );
  }
  const crease: Parameters<typeof createAutoMovieEllipticLoftAtlas>[0] = make();
  crease.loft.spans[1].radiusX = [0.02, 0.025, 0.025, 0.03];
  const joined: ReturnType<typeof realizeAutoMovieBicubicAtlas64> =
    realizeAutoMovieBicubicAtlas64(
      createAutoMovieEllipticLoftAtlas(crease).geometry,
    );
  const normalLimits: number[] = [];
  for (let index: number = 0; index < joined.mesh.positions.length; index += 3)
    if (
      nclose(joined.mesh.positions[index], 0.02, 1e-12) &&
      nclose(joined.mesh.positions[index + 1], 0.05, 1e-12) &&
      nclose(joined.mesh.positions[index + 2], 0, 1e-12)
    )
      normalLimits.push(joined.mesh.normals![index + 1]);
  TestValidator.predicate(
    "C0 axial seam preserves both analytic normal limits",
    normalLimits.some((value: number): boolean => Math.abs(value) < 1e-12) &&
      normalLimits.some((value: number): boolean => value < -0.1),
  );
  const variants: Parameters<typeof createAutoMovieEllipticLoftAtlas>[0][] = [];
  const zero: (typeof variants)[number] = make();
  zero.loft.spans[0].radiusX[1] = 0;
  variants.push(zero);
  const gap: (typeof variants)[number] = make();
  gap.loft.spans[1].interval[0] += 0.001;
  variants.push(gap);
  const reverse: (typeof variants)[number] = make();
  reverse.loft.spans[0].interval.reverse();
  variants.push(reverse);
  const unequal: (typeof variants)[number] = make();
  unequal.loft.spans[1].radiusZ[0] += 0.001;
  variants.push(unequal);
  const sparse: (typeof variants)[number] = make();
  const controls: number[] = sparse.loft.spans[0].centreX;
  delete controls[1];
  variants.push(sparse);
  const invalidBudget: (typeof variants)[number] = make();
  invalidBudget.maxVertices = 0;
  variants.push(invalidBudget);
  for (const input of variants) {
    let refused: boolean = false;
    try {
      createAutoMovieEllipticLoftAtlas(input);
    } catch {
      refused = true;
    }
    TestValidator.predicate("invalid field refuses without repair", refused);
  }
  const exhausted: ReturnType<typeof realizeAutoMovieBicubicAtlas64> =
    realizeAutoMovieBicubicAtlas64({ ...result.geometry, maxCells: 1 });
  TestValidator.equals(
    "tessellation exhaustion remains incomplete",
    exhausted.complete,
    false,
  );
}
