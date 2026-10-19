import { evaluateAutoMovieSupportSection } from "@automovie/engine/geometry/evaluateAutoMovieSupportSection";
import type {
  IAutoMovieRecoveryImageObservation,
  IAutoMovieRecoverySupportLoft,
} from "@automovie/interface/recovery";
import {
  compileAutoMovieRecoverySupportLoft,
  fitAutoMovieRecoveryImageLoft,
  fitAutoMovieRecoveryImageSupportLoft,
  observeAutoMovieRecoveryImages,
} from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { recoverySupportFixture } from "../internal/recoverySupportFixture";

/**
 * Actual RGB supports produce compact nonelliptical curves and independent surfaces.
 *
 * Scenarios:
 * 1. Box, rotated-box and smooth asymmetric images fit the general support path while the ellipse prior refuses.
 * 2. Six angles never supplied to fitting agree with independent RGB support within two pixels.
 * 3. Saved coefficients generate new geometry without observations; combined independent edits and exact return preserve their coordinate semantics.
 * 4. Contradictory calibrated supports and disconnected visible rows refuse instead of discarding a view or filling a gap.
 * 5. Inadequate directions, event/row budgets, malformed coverage/scales and cancellation refuse or cancel explicitly.
 *
 * @evidence contracts/testing.md#behavioral-verification Exercises public RGB observation, support fitting, independent source-free compilation and actual engine mesh/normals. It checks held-out analytic raster support, compact coefficients, boundary events and independent edits rather than source arrangement or private helper snapshots.
 * @evidence contracts/testing.md#independent-expectations Analytic box and strictly convex harmonic support formulas rasterize independent truth. Six reserved angles enter only evaluation, with a fixed .5 mm support bound. The 0/90 degree half-widths a,b cap 45 degree support at (a+b)/sqrt(2), so a wider middle image contradicts them. Coordinate scaling equations and exact return define edit expectations independently of the generated field.
 * @evidence contracts/testing.md#distinguishing-cases Covers sharp active-boundary changes versus smooth sections, translated cubic profiles, an unsupported ellipse hypothesis, contradictory supports, disconnected visible rows, scalar compactness, withheld directions, explicit unknown hidden topology, malformed coverage/unit normals/scales and row/event limits. Actual hardware appearance and installed consumer isolation are separate host checks, not inferred from this analytic unit.
 * @evidence contracts/testing.md#execution-ownership This portable test_recovery_image_support_loft entry owns bounded resident RGB arrays and CPU-generated mesh only, without process, filesystem, native build, renderer, GPU or Human imports.
 */
export function test_recovery_image_support_loft(): void {
  const generation: Parameters<typeof compileAutoMovieRecoverySupportLoft>[1] =
    {
      tolerance: 0.00005,
      maxPlanes: 32,
      maxEvents: 128,
      maxCells: 20_000,
      maxVertices: 30_000,
      minimumDirectionSine: 0.0001,
    };
  const policy: Parameters<typeof fitAutoMovieRecoveryImageSupportLoft>[1] = {
    family: "finite-view-convex-support",
    maxViews: 16,
    maxRows: 6000,
    maxSpans: 4,
    maximumResidualPx: 2,
    minimumSplineRatio: 1e-8,
    generation,
  };
  let saved: IAutoMovieRecoverySupportLoft | undefined;
  let observation: IAutoMovieRecoveryImageObservation | undefined;
  for (const kind of ["box", "rotated-box", "smooth-asymmetric"] as const) {
    const observed: ReturnType<typeof observeAutoMovieRecoveryImages> =
      observeAutoMovieRecoveryImages(recoverySupportFixture(kind));
    if (!("value" in observed))
      throw new Error(observed.diagnostics.join("; "));
    observation = observed.value;
    const fitted: ReturnType<typeof fitAutoMovieRecoveryImageSupportLoft> =
      fitAutoMovieRecoveryImageSupportLoft(observed.value, policy);
    if (!("value" in fitted)) throw new Error(fitted.diagnostics.join("; "));
    TestValidator.predicate(
      "compact qualified partial support representation",
      fitted.status === "partial" &&
        fitted.value.recipe.coverage.hiddenConcavities === "unobserved" &&
        fitted.value.recipe.coverage.interior === "unobserved" &&
        fitted.value.recipe.coverage.enclosure === "not-certified" &&
        fitted.value.maximumResidualPx <= 2 &&
        fitted.value.counts.freeScalars === 96 &&
        JSON.stringify(fitted.value.recipe).length < 12000,
    );
    TestValidator.predicate(
      "actual continuous topology matches family needs",
      kind === "smooth-asymmetric"
        ? fitted.value.generation.events === 0
        : fitted.value.generation.events > 0,
    );
    if (kind === "box")
      TestValidator.equals(
        "active events cannot evade a zero event budget",
        fitAutoMovieRecoveryImageSupportLoft(observed.value, {
          ...policy,
          generation: { ...generation, maxEvents: 0 },
        }).status,
        "refused",
      );
    TestValidator.equals(
      "ellipse family must not hide nonellipse evidence",
      fitAutoMovieRecoveryImageLoft(observed.value, {
        family: "aligned-elliptical-sections",
        maxViews: 16,
        maxRows: 6000,
        maxSpans: 4,
        maximumResidualPx: 2,
        minimumDirectionRatio: 0.001,
        minimumSplineRatio: 1e-8,
      }).status,
      "refused",
    );
    const reserve: ReturnType<typeof observeAutoMovieRecoveryImages> =
      observeAutoMovieRecoveryImages(
        recoverySupportFixture(kind, [7, 39, 83, 132, 211, 278]),
      );
    if (!("value" in reserve)) throw new Error(reserve.diagnostics.join("; "));
    const recipe: IAutoMovieRecoverySupportLoft = fitted.value.recipe;
    for (const view of reserve.value.views)
      for (const row of view.rows.filter(
        (_: (typeof view.rows)[number], i: number): boolean => i % 37 === 0,
      )) {
        const field: (typeof recipe.loft.spans)[number] = recipe.loft.spans[0];
        const t: number =
          (row.yMm * 0.001 - field.interval[0]) /
          (field.interval[1] - field.interval[0]);
        const vertices: ReturnType<typeof evaluateAutoMovieSupportSection> =
          evaluateAutoMovieSupportSection({
            normals: recipe.loft.planes.map(
              (p: (typeof recipe.loft.planes)[number]): [number, number] =>
                p.normal,
            ),
            offsets: field.offsets.map(
              (q: number[]): number =>
                q[0] * (1 - t) ** 3 +
                3 * q[1] * t * (1 - t) ** 2 +
                3 * q[2] * t * t * (1 - t) +
                q[3] * t ** 3,
            ),
            minimumDirectionSine: 0.0001,
          });
        const projections: number[] = vertices.map(
          (v: (typeof vertices)[number]): number =>
            1000 *
            (v.point[0] * Math.cos(view.camera.azimuthRadians) +
              v.point[1] * Math.sin(view.camera.azimuthRadians)),
        );
        TestValidator.predicate(
          "untouched camera support meets fixed pixel budget",
          Math.abs(Math.min(...projections) - row.lowerMm) <= 0.5 &&
            Math.abs(Math.max(...projections) - row.upperMm) <= 0.5,
        );
      }
    saved = JSON.parse(JSON.stringify(recipe)) as IAutoMovieRecoverySupportLoft;
  }
  if (!saved || !observation)
    throw new Error("Expected saved support coefficients");
  const original: ReturnType<typeof compileAutoMovieRecoverySupportLoft> =
    compileAutoMovieRecoverySupportLoft(saved, generation);
  if (!("value" in original)) throw new Error(original.diagnostics.join("; "));
  const mesh: (typeof original.value.model.parts)[number]["geometry"] =
    original.value.model.parts[0].geometry;
  if (mesh.type !== "mesh") throw new Error("Expected new support geometry");
  saved.dimensions = { widthScale: 1.6, depthScale: 0.7, heightScale: 1.4 };
  const edited: ReturnType<typeof compileAutoMovieRecoverySupportLoft> =
    compileAutoMovieRecoverySupportLoft(saved, generation);
  if (!("value" in edited)) throw new Error(edited.diagnostics.join("; "));
  const changed: (typeof edited.value.model.parts)[number]["geometry"] =
    edited.value.model.parts[0].geometry;
  if (changed.type !== "mesh")
    throw new Error("Expected edited support geometry");
  // Extents compare the independently transformed field, without assuming an identical tessellation after editing.
  for (const axis of [0, 1, 2]) {
    const a: number[] = mesh.mesh.positions.filter(
      (_: number, i: number): boolean => i % 3 === axis,
    );
    const b: number[] = changed.mesh.positions.filter(
      (_: number, i: number): boolean => i % 3 === axis,
    );
    const scale: number = [1.6, 1.4, 0.7][axis];
    const anchor: number = axis === 1 ? saved.loft.spans[0].interval[0] : 0;
    TestValidator.predicate(
      "independent coordinate scales preserve unrelated dimensions",
      nclose(
        Math.max(...b),
        anchor + (Math.max(...a) - anchor) * scale,
        0.0001,
      ) &&
        nclose(
          Math.min(...b),
          anchor + (Math.min(...a) - anchor) * scale,
          0.0001,
        ),
    );
  }
  saved.dimensions = { widthScale: 1, depthScale: 1, heightScale: 1 };
  const returned: ReturnType<typeof compileAutoMovieRecoverySupportLoft> =
    compileAutoMovieRecoverySupportLoft(saved, generation);
  TestValidator.predicate(
    "exact recipe return restores source-free mesh and construction",
    "value" in returned &&
      JSON.stringify(returned.value) === JSON.stringify(original.value),
  );
  const controller: AbortController = new AbortController();
  controller.abort();
  TestValidator.equals(
    "pre-cancelled support fitting",
    fitAutoMovieRecoveryImageSupportLoft(observation, policy, {
      signal: controller.signal,
    }).status,
    "cancelled",
  );
  const disconnected: ReturnType<typeof recoverySupportFixture> =
    recoverySupportFixture("box", [0, 45, 90]);
  const view: (typeof disconnected.views)[number] = disconnected.views[0];
  for (let row: number = 180; row < 260; row++)
    for (let column: number = 120; column < 136; column++)
      view.rgb8.fill(
        240,
        3 * (row * view.width + column),
        3 * (row * view.width + column + 1),
      );
  const unsupported: ReturnType<typeof observeAutoMovieRecoveryImages> =
    observeAutoMovieRecoveryImages(disconnected);
  TestValidator.predicate(
    "visible disconnected sections refuse instead of taking their convex hull",
    unsupported.status === "refused" &&
      unsupported.diagnostics.some((message: string): boolean =>
        message.includes("disconnected foreground"),
      ),
  );
  const inconsistent: ReturnType<typeof recoverySupportFixture> =
    recoverySupportFixture("box", [0, 45, 90]);
  inconsistent.cohort = "inconsistent-stress";
  const middle: (typeof inconsistent.views)[number] = inconsistent.views[1];
  // Its 28 mm half-width exceeds the independent 0/90 degree support bound
  // at every row; all pixels remain inside the same admitted camera chart.
  for (let row: number = 40; row < 440; row++)
    for (let column: number = 16; column < 240; column++)
      middle.rgb8.set([30, 80, 130], 3 * (row * middle.width + column));
  const inconsistentObservation: ReturnType<
    typeof observeAutoMovieRecoveryImages
  > = observeAutoMovieRecoveryImages(inconsistent);
  if (!("value" in inconsistentObservation))
    throw new Error(inconsistentObservation.diagnostics.join("; "));
  TestValidator.equals(
    "individually fitted offsets cannot hide contradictory implied supports",
    fitAutoMovieRecoveryImageSupportLoft(inconsistentObservation.value, policy)
      .status,
    "refused",
  );
  TestValidator.equals(
    "row budget refusal",
    fitAutoMovieRecoveryImageSupportLoft(observation, { ...policy, maxRows: 1 })
      .status,
    "refused",
  );
  const repeated: ReturnType<typeof observeAutoMovieRecoveryImages> =
    observeAutoMovieRecoveryImages(recoverySupportFixture("box", [0, 0, 180]));
  if (!("value" in repeated)) throw new Error(repeated.diagnostics.join("; "));
  TestValidator.equals(
    "inadequate supplied directions refuse",
    fitAutoMovieRecoveryImageSupportLoft(repeated.value, policy).status,
    "refused",
  );
  const malformed: IAutoMovieRecoverySupportLoft = structuredClone(saved);
  malformed.dimensions.widthScale = 0;
  TestValidator.equals(
    "invalid support edit refuses",
    compileAutoMovieRecoverySupportLoft(malformed, generation).status,
    "refused",
  );
  malformed.dimensions.widthScale = 1;
  malformed.loft.planes[0].normal[0] *= 2;
  TestValidator.equals(
    "original nonunit planes refuse before edit normalization",
    compileAutoMovieRecoverySupportLoft(malformed, generation).status,
    "refused",
  );
  malformed.loft.planes[0].normal[0] /= 2;
  Reflect.set(malformed.coverage, "enclosure", "certified");
  TestValidator.equals(
    "hidden enclosure claim refuses",
    compileAutoMovieRecoverySupportLoft(malformed, generation).status,
    "refused",
  );
}
