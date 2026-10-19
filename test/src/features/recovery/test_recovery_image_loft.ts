import { realizeAutoMovieBicubicAtlas64 } from "@automovie/engine/geometry/realizeAutoMovieBicubicAtlas64";
import type {
  IAutoMovieRecoveryImageInput,
  IAutoMovieRecoveryImageLoft,
  IAutoMovieRecoveryImageObservation,
} from "@automovie/interface/recovery";
import {
  compileAutoMovieRecoveryImageLoft,
  fitAutoMovieRecoveryImageLoft,
  observeAutoMovieRecoveryImages,
} from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { recoveryImageFixture } from "../internal/recoveryImageFixture";

/**
 * Calibrated RGB silhouettes produce qualified compact coefficients and independent geometry.
 *
 * Scenarios:
 * 1. An analytic elliptical family yields compact coefficients and finite own-engine geometry.
 * 2. Four directions excluded from fitting agree with independent analytic support.
 * 3. Box support, repeated/two distinct directions, contradictory charts and exhausted budgets refuse.
 * 4. An oscillating profile needs multiple spans and remains bounded by the declared fit budget.
 * 5. Serialized recipes reconstruct without observations, and independent dimension edits preserve unrelated axes and exact return.
 *
 * @evidence contracts/testing.md#behavioral-verification Exercises public image observation, inverse fitting, saved-recipe compilation and the actual bicubic engine realization. Asserts conditional residuals, emitted vertex fidelity, explicit partial coverage, reserved-angle support and dimension behavior rather than inspecting implementation strings.
 * @evidence contracts/testing.md#independent-expectations Closed-form ellipse and box support and physical pixel centres supply independent geometric expectations. Emitted vertices are checked against the analytic implicit ellipse at their actual Y; half-pixel observation noise, circular-cubic approximation and tessellation are covered by a fixed 0.5 mm vertex tolerance. Reserved directions never enter fitting.
 * @evidence contracts/testing.md#distinguishing-cases Covers cubic and oscillating profiles, unsupported nonellipse support, duplicate/insufficient directions, contradictory camera metadata, span/row/rank budgets, malformed observation rows, positive scales, combined edits and exact recipe return. Image-mask admission has its own test; this analytic cohort establishes no photographic or camera-estimation performance.
 * @evidence contracts/testing.md#execution-ownership The portable test_recovery_image_loft entry owns small RGB/observation arrays and a bounded CPU engine mesh only. It opens no file, installs no package, starts no process/browser/GPU and imports no Human generator or viewer.
 */
export function test_recovery_image_loft(): void {
  const policy: Parameters<typeof fitAutoMovieRecoveryImageLoft>[1] = {
    family: "aligned-elliptical-sections",
    maxViews: 8,
    maxRows: 4000,
    maxSpans: 8,
    maximumResidualPx: 2,
    minimumDirectionRatio: 0.001,
    minimumSplineRatio: 1e-8,
  };
  const observe: (
    input: IAutoMovieRecoveryImageInput,
  ) => IAutoMovieRecoveryImageObservation = (
    input: IAutoMovieRecoveryImageInput,
  ): IAutoMovieRecoveryImageObservation => {
    const result: ReturnType<typeof observeAutoMovieRecoveryImages> =
      observeAutoMovieRecoveryImages(input);
    if (!("value" in result)) throw new Error(result.diagnostics.join("; "));
    return result.value;
  };
  const observation: IAutoMovieRecoveryImageObservation = observe(
    recoveryImageFixture(),
  );
  const fitted: ReturnType<typeof fitAutoMovieRecoveryImageLoft> =
    fitAutoMovieRecoveryImageLoft(observation, policy);
  TestValidator.equals("unseen ends remain partial", fitted.status, "partial");
  if (!("value" in fitted)) throw new Error(fitted.diagnostics.join("; "));
  TestValidator.predicate(
    "all support and directional evidence qualified",
    fitted.value.maximumResidualPx <= 2 &&
      fitted.value.familyResidualPx <= 2 &&
      fitted.value.directionRank.radii > 0.1 &&
      fitted.value.counts.spans === 1 &&
      fitted.value.counts.freeScalars === 16,
  );
  const recipe: IAutoMovieRecoveryImageLoft = JSON.parse(
    JSON.stringify(fitted.value.recipe),
  ) as IAutoMovieRecoveryImageLoft;
  TestValidator.predicate(
    "generation document stays compact",
    JSON.stringify(recipe).length < 3000,
  );
  const evaluate: (y: number) => [number, number, number, number] = (
    y: number,
  ): [number, number, number, number] => {
    const span: IAutoMovieRecoveryImageLoft["loft"]["spans"][number] =
      recipe.loft.spans.find(
        (part: IAutoMovieRecoveryImageLoft["loft"]["spans"][number]): boolean =>
          y <= part.interval[1],
      ) ?? recipe.loft.spans[recipe.loft.spans.length - 1];
    const t: number =
      (y - span.interval[0]) / (span.interval[1] - span.interval[0]);
    return (["radiusX", "radiusZ", "centreX", "centreZ"] as const).map(
      (key: "radiusX" | "radiusZ" | "centreX" | "centreZ"): number =>
        span[key][0] * (1 - t) ** 3 +
        3 * span[key][1] * t * (1 - t) ** 2 +
        3 * span[key][2] * t * t * (1 - t) +
        span[key][3] * t ** 3,
    ) as [number, number, number, number];
  };
  for (const degrees of [17, 63, 137, 223])
    for (const t of [0.05, 0.23, 0.51, 0.77, 0.95]) {
      const angle: number = (degrees * Math.PI) / 180;
      const actual: [number, number, number, number] = evaluate(t * 0.1);
      const expectedRadius: number = Math.hypot(
        Math.cos(angle) * (18 + 8 * t - 12 * t * t + 5 * t * t * t),
        Math.sin(angle) * (10 + 7 * t + 4 * t * t - 3 * t * t * t),
      );
      const expectedCentre: number =
        Math.cos(angle) * (2 - 4 * t + 2 * t * t) +
        Math.sin(angle) * (-1 + 3 * t - 2 * t * t);
      const actualRadius: number =
        1000 *
        Math.hypot(Math.cos(angle) * actual[0], Math.sin(angle) * actual[1]);
      const actualCentre: number =
        1000 * (Math.cos(angle) * actual[2] + Math.sin(angle) * actual[3]);
      TestValidator.predicate(
        "reserved direction limits meet two-pixel budget",
        Math.abs(
          actualCentre - actualRadius - expectedCentre + expectedRadius,
        ) <= 0.5 &&
          Math.abs(
            actualCentre + actualRadius - expectedCentre - expectedRadius,
          ) <= 0.5,
      );
    }
  const budget: Parameters<typeof compileAutoMovieRecoveryImageLoft>[1] = {
    tolerance: 0.0001,
    maxCells: 20_000,
    maxVertices: 30_000,
  };
  const compiled: ReturnType<typeof compileAutoMovieRecoveryImageLoft> =
    compileAutoMovieRecoveryImageLoft(recipe, budget);
  if (!("value" in compiled)) throw new Error(compiled.diagnostics.join("; "));
  const geometry: (typeof compiled.value.model.parts)[number]["geometry"] =
    compiled.value.model.parts[0].geometry;
  if (geometry.type !== "bicubic-atlas")
    throw new Error("Expected public coefficient atlas");
  const realized: ReturnType<typeof realizeAutoMovieBicubicAtlas64> =
    realizeAutoMovieBicubicAtlas64(geometry);
  TestValidator.predicate(
    "own engine produces complete finite lateral surface",
    realized.complete &&
      realized.approximationQualified &&
      realized.mesh.positions.length > 0 &&
      (realized.mesh.indices?.length ?? 0) > 0 &&
      realized.mesh.positions.every(Number.isFinite) &&
      realized.mesh.normals !== null &&
      realized.mesh.normals.every(Number.isFinite),
  );
  for (
    let index: number = 0;
    index < realized.mesh.positions.length;
    index += 3
  ) {
    const x: number = 1000 * realized.mesh.positions[index],
      y: number = 1000 * realized.mesh.positions[index + 1],
      z: number = 1000 * realized.mesh.positions[index + 2];
    const t: number = y / 100,
      a: number = 18 + 8 * t - 12 * t * t + 5 * t * t * t,
      b: number = 10 + 7 * t + 4 * t * t - 3 * t * t * t;
    const defect: number =
      Math.abs(
        Math.hypot(
          (x - (2 - 4 * t + 2 * t * t)) / a,
          (z - (-1 + 3 * t - 2 * t * t)) / b,
        ) - 1,
      ) * Math.max(a, b);
    TestValidator.predicate(
      "generated vertices meet independent ellipse truth",
      defect <= 0.5,
    );
  }
  for (const mutation of ["fractional", "gap"]) {
    const corrupted: IAutoMovieRecoveryImageObservation = observe(
      recoveryImageFixture(),
    );
    if (mutation === "fractional")
      corrupted.views[0].rows[2].lowerMm += 0.03125;
    else corrupted.views[0].rows.splice(2, 1);
    const refusal: ReturnType<typeof fitAutoMovieRecoveryImageLoft> =
      fitAutoMovieRecoveryImageLoft(corrupted, policy);
    TestValidator.predicate(
      "saved observations must preserve measured pixel cells and rows",
      refusal.status === "refused" &&
        refusal.diagnostics.some((message: string): boolean =>
          message.includes("invalid-pixel-support"),
        ),
    );
  }
  const original: string = JSON.stringify(compiled.value);
  recipe.dimensions = { widthScale: 2, depthScale: 0.75, heightScale: 1.5 };
  const edited: ReturnType<typeof compileAutoMovieRecoveryImageLoft> =
    compileAutoMovieRecoveryImageLoft(recipe, budget);
  if (!("value" in edited)) throw new Error(edited.diagnostics.join("; "));
  const changed: (typeof edited.value.model.parts)[number]["geometry"] =
    edited.value.model.parts[0].geometry;
  if (changed.type !== "bicubic-atlas")
    throw new Error("Expected edited coefficient atlas");
  const anchor: number = recipe.loft.spans[0].interval[0];
  for (let index: number = 0; index < geometry.controls.length; index++) {
    const a: (typeof geometry.controls)[number] = geometry.controls[index],
      b: (typeof geometry.controls)[number] = changed.controls[index];
    TestValidator.predicate(
      "independent dimension equations preserved",
      nclose(b.x, 2 * a.x) &&
        nclose(b.z, 0.75 * a.z) &&
        nclose(b.y, anchor + 1.5 * (a.y - anchor)),
    );
  }
  recipe.dimensions = { widthScale: 1, depthScale: 1, heightScale: 1 };
  const returned: ReturnType<typeof compileAutoMovieRecoveryImageLoft> =
    compileAutoMovieRecoveryImageLoft(recipe, budget);
  TestValidator.predicate(
    "exact return restores generation and construction",
    "value" in returned && JSON.stringify(returned.value) === original,
  );
  for (const angles of [
    [0, 0, 180],
    [0, 90, 180],
  ]) {
    const refusal: ReturnType<typeof fitAutoMovieRecoveryImageLoft> =
      fitAutoMovieRecoveryImageLoft(
        observe(recoveryImageFixture({ angles })),
        policy,
      );
    TestValidator.equals(
      "insufficient distinct directions refuse",
      refusal.status,
      "refused",
    );
  }
  const box: ReturnType<typeof fitAutoMovieRecoveryImageLoft> =
    fitAutoMovieRecoveryImageLoft(
      observe(recoveryImageFixture({ kind: "box" })),
      policy,
    );
  TestValidator.predicate(
    "nonellipse evidence refuses its family",
    box.status === "refused" &&
      box.diagnostics.some((message: string): boolean =>
        message.includes("unsupported-family"),
      ),
  );
  const contradictory: IAutoMovieRecoveryImageObservation = observe(
    recoveryImageFixture(),
  );
  contradictory.views[1].camera.azimuthRadians = 0;
  TestValidator.equals(
    "contradictory chart cannot pass supported family",
    fitAutoMovieRecoveryImageLoft(contradictory, policy).status,
    "refused",
  );
  const malformed: IAutoMovieRecoveryImageObservation = observe(
    recoveryImageFixture(),
  );
  Reflect.deleteProperty(malformed.views[0].rows, "2");
  TestValidator.equals(
    "sparse observation rows refuse",
    fitAutoMovieRecoveryImageLoft(malformed, policy).status,
    "refused",
  );
  TestValidator.equals(
    "row budget enforced",
    fitAutoMovieRecoveryImageLoft(observation, { ...policy, maxRows: 1 })
      .status,
    "refused",
  );
  const illConditioned: ReturnType<typeof fitAutoMovieRecoveryImageLoft> =
    fitAutoMovieRecoveryImageLoft(observation, {
      ...policy,
      minimumSplineRatio: 0.9999,
    });
  TestValidator.predicate(
    "spline rank refusal preserves its cause",
    illConditioned.status === "refused" &&
      illConditioned.diagnostics.some((message: string): boolean =>
        message.includes("ill-conditioned-fit"),
      ),
  );
  const oscillating: IAutoMovieRecoveryImageObservation = observe(
    recoveryImageFixture({
      profile: (t: number): [number, number, number, number] => [
        18 + 4 * Math.sin(4 * Math.PI * t),
        12 + 2 * Math.cos(2 * Math.PI * t),
        0,
        0,
      ],
    }),
  );
  TestValidator.equals(
    "one span cannot hide oscillating shape error",
    fitAutoMovieRecoveryImageLoft(oscillating, { ...policy, maxSpans: 1 })
      .status,
    "refused",
  );
  const multiple: ReturnType<typeof fitAutoMovieRecoveryImageLoft> =
    fitAutoMovieRecoveryImageLoft(oscillating, policy);
  TestValidator.predicate(
    "bounded multiple spans model the supported profile",
    "value" in multiple &&
      multiple.value.counts.spans > 1 &&
      multiple.value.maximumResidualPx <= 2,
  );
  recipe.dimensions.widthScale = 0;
  TestValidator.equals(
    "invalid edit refuses without geometry",
    compileAutoMovieRecoveryImageLoft(recipe, budget).status,
    "refused",
  );
}
