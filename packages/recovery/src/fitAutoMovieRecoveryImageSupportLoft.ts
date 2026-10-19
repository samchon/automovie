import { evaluateAutoMovieSupportSection } from "@automovie/engine/geometry/evaluateAutoMovieSupportSection";
import { realizeAutoMovieConvexSupportLoft } from "@automovie/engine/geometry/realizeAutoMovieConvexSupportLoft";
import type { IAutoMovieConvexSupportLoft } from "@automovie/interface";
import type { IAutoMovieRecoveryImageObservation } from "@automovie/interface/recovery";

import type { IAutoMovieRecoveryOperation } from "./IAutoMovieRecoveryOperation";
import type { IAutoMovieRecoverySupportFit } from "./IAutoMovieRecoverySupportFit";
import { fitRecoveryScalarProfiles } from "./internal/fitRecoveryScalarProfiles";
import { prepareRecoveryImageSupports } from "./internal/prepareRecoveryImageSupports";

/**
 * Fit compact continuous support profiles from supplied-camera image envelopes.
 * Every view supplies two oriented inequalities, not a corresponding material
 * contour. Increasing common cubic spaces are tried in order. Both offset fits
 * and the implied polygon's supports must meet every common-domain observation;
 * engine admission qualifies feasible active-boundary changes before transfer.
 * The finite-view section hull cannot identify hidden concavity or interior.
 * Segmentation/calibration uncertainty prevents a certified true enclosure.
 *
 * @evidence contracts/common.md#principled-implementation Shared measured-row admission/interpolation and Householder spline fitting preserve the supplied pixel charts. Oriented upper/negative-lower support profiles define a finite half-plane intersection, whose actual directional supports and continuous engine boundary plan are checked separately from each profile's residual.
 * @evidence contracts/common.md#clear-and-simple-design Recovery owns observation policy, compact inverse fitting and residual acceptance; generic engine owns support intersections, event incidence and new geometry/normals. The saved recipe excludes dense observations and source geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No ellipse prior, fixed polygon correspondence, per-row saved contour, discarded view, inferred cap, original mesh/normal or camera estimate supplies the result. Exhausted residual/rank/event/geometry budgets refuse without changing thresholds.
 * @evidence contracts/common.md#meaningful-documentation States support rather than material correspondence, cubic candidate order, common-domain comparison, implied-hull checks, supplied cameras, partial unknown coverage and numerical rather than certified enclosure status.
 * @evidence contracts/performance.md#efficient-algorithms For N common rows, V views and K=spans+3, each candidate costs O(N K squared + N K V + N V cubed), plus the generic engine's bounded continuous planning/emission. maxViews/maxRows/maxSpans and event/cell/vertex budgets bound all retained populations before their owning allocations.
 * @evidence contracts/performance.md#reuse-equivalent-work One prepared common chart and one shared factorization per candidate serve all 2V offset fields; accepted engine diagnostics accompany the same coefficient field without retaining the generated acquisition-time mesh.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Local observation, fit and temporary engine scratch expires synchronously; only compact coefficients, source identities and scalar diagnostics transfer. Cancellation is checked between candidates and before transfer, with no file, worker or global cache acquired.
 */
export function fitAutoMovieRecoveryImageSupportLoft(
  observation: IAutoMovieRecoveryImageObservation,
  policy: {
    family: "finite-view-convex-support";
    maxViews: number;
    maxRows: number;
    maxSpans: number;
    maximumResidualPx: number;
    minimumSplineRatio: number;
    generation: Omit<
      Parameters<typeof realizeAutoMovieConvexSupportLoft>[0],
      "loft" | "topologyDomain"
    >;
  },
  options: IAutoMovieRecoveryOperation.Options = {},
): IAutoMovieRecoveryOperation.Result<IAutoMovieRecoverySupportFit> {
  const schema: IAutoMovieRecoveryOperation.Result<unknown>["schema"] =
    "automovie-recovery-operation-v1";
  const operator: IAutoMovieRecoveryOperation.Result<unknown>["operator"] =
    "image-support-loft-v1";
  const cancelled: () => boolean = (): boolean =>
    options.signal?.aborted === true;
  if (cancelled())
    return {
      schema,
      operator,
      status: "cancelled",
      diagnostics: ["Cancelled before support fitting"],
    };
  let callback: boolean = false;
  try {
    if (
      !policy ||
      policy.family !== "finite-view-convex-support" ||
      !Number.isSafeInteger(policy.maxSpans) ||
      policy.maxSpans < 1 ||
      !Number.isFinite(policy.maximumResidualPx) ||
      policy.maximumResidualPx <= 0 ||
      !Number.isFinite(policy.minimumSplineRatio) ||
      policy.minimumSplineRatio <= 0 ||
      policy.minimumSplineRatio >= 1 ||
      !policy.generation ||
      ![
        policy.generation.maxPlanes,
        policy.generation.maxCells,
        policy.generation.maxVertices,
      ].every((n: number): boolean => Number.isSafeInteger(n) && n > 0) ||
      !Number.isSafeInteger(policy.generation.maxEvents) ||
      policy.generation.maxEvents < 0 ||
      !Number.isFinite(policy.generation.tolerance) ||
      policy.generation.tolerance <= 0 ||
      !Number.isFinite(policy.generation.minimumDirectionSine) ||
      policy.generation.minimumDirectionSine <= 0 ||
      policy.generation.minimumDirectionSine >= 1
    )
      throw new Error(
        "invalid-support-fit: explicit family, residual/rank and generation budgets required",
      );
    const prepared: ReturnType<typeof prepareRecoveryImageSupports> =
      prepareRecoveryImageSupports(observation, policy);
    if (2 * observation.views.length > policy.generation.maxPlanes)
      throw new Error(
        "support-plane-budget-exhausted: every view retains both oriented supports",
      );
    const normals: [number, number][] = [
      ...prepared.directions.map(
        (direction: (typeof prepared.directions)[number]): [number, number] => [
          direction.c,
          direction.s,
        ],
      ),
      ...prepared.directions.map(
        (direction: (typeof prepared.directions)[number]): [number, number] => [
          -direction.c,
          -direction.s,
        ],
      ),
    ];
    const samples: { yMm: number; values: number[] }[] = prepared.stations.map(
      (yMm: number, row: number): { yMm: number; values: number[] } => ({
        yMm,
        values: [
          ...prepared.supports.map(
            (view: (typeof prepared.supports)[number]): number =>
              view[row].upperMm,
          ),
          ...prepared.supports.map(
            (view: (typeof prepared.supports)[number]): number =>
              -view[row].lowerMm,
          ),
        ],
      }),
    );
    let last: string = "No coefficient space satisfied all observations";
    for (
      let count: number = 1;
      count <= policy.maxSpans && count + 3 <= samples.length;
      count++
    ) {
      if (cancelled())
        return {
          schema,
          operator,
          status: "cancelled",
          diagnostics: ["Cancelled between support candidates"],
        };
      const fit: ReturnType<typeof fitRecoveryScalarProfiles> =
        fitRecoveryScalarProfiles(samples, count, policy.minimumSplineRatio);
      const loft: IAutoMovieConvexSupportLoft = {
        planes: normals.map(
          (
            normal: [number, number],
            i: number,
          ): IAutoMovieConvexSupportLoft["planes"][number] => ({
            id: `support.${i}`,
            normal,
          }),
        ),
        spans: fit.spans.map(
          (
            span: (typeof fit.spans)[number],
          ): IAutoMovieConvexSupportLoft["spans"][number] => ({
            interval: span.interval,
            offsets: span.profiles,
          }),
        ),
      };
      let residual: number = 0;
      for (let row: number = 0; row < samples.length; row++) {
        const y: number = samples[row].yMm * 0.001;
        const span: IAutoMovieConvexSupportLoft["spans"][number] =
          loft.spans.find(
            (field: IAutoMovieConvexSupportLoft["spans"][number]): boolean =>
              y <= field.interval[1],
          ) ?? loft.spans[loft.spans.length - 1];
        const t: number =
          (y - span.interval[0]) / (span.interval[1] - span.interval[0]);
        const offsets: number[] = span.offsets.map(
          (q: number[]): number =>
            q[0] * (1 - t) ** 3 +
            3 * q[1] * t * (1 - t) ** 2 +
            3 * q[2] * t * t * (1 - t) +
            q[3] * t ** 3,
        );
        const section: ReturnType<typeof evaluateAutoMovieSupportSection> =
          evaluateAutoMovieSupportSection({
            normals,
            offsets,
            minimumDirectionSine: policy.generation.minimumDirectionSine,
          });
        for (let plane: number = 0; plane < normals.length; plane++) {
          const support: number = Math.max(
            ...section.map(
              (vertex: (typeof section)[number]): number =>
                normals[plane][0] * vertex.point[0] +
                normals[plane][1] * vertex.point[1],
            ),
          );
          const pitch: number =
            observation.views[plane % observation.views.length].camera
              .pixelPitchMm;
          residual = Math.max(
            residual,
            Math.abs(1000 * offsets[plane] - samples[row].values[plane]) /
              pitch,
            Math.abs(1000 * support - samples[row].values[plane]) / pitch,
          );
        }
      }
      callback = true;
      options.onProgress?.("support-profile-candidate", count, policy.maxSpans);
      callback = false;
      if (!(residual <= policy.maximumResidualPx)) {
        last = `Implied support residual ${residual} px`;
        continue;
      }
      const generated: ReturnType<typeof realizeAutoMovieConvexSupportLoft> =
        realizeAutoMovieConvexSupportLoft({
          ...policy.generation,
          loft,
          topologyDomain: `support-fit:${observation.objectId}`,
        });
      if (cancelled())
        return {
          schema,
          operator,
          status: "cancelled",
          diagnostics: ["Cancelled before support fit transfer"],
        };
      return {
        schema,
        operator,
        status: "partial",
        diagnostics: [
          "Finite-view convex section approximation with supplied cameras and asserted rigidity; hidden concavity, caps and interior remain unobserved",
          "Common-domain interpolation and fitted supports are conditional on segmentation/calibration; true enclosure is not certified",
          "Boundary events and canonical incidence are binary64 numerical constructions, not interval certificates",
        ],
        value: {
          recipe: {
            schema: "automovie-recovery-support-loft-v1",
            family: policy.family,
            objectId: observation.objectId,
            frame: observation.frame,
            loft,
            dimensions: { widthScale: 1, depthScale: 1, heightScale: 1 },
            coverage: {
              lateralSurface: "inferred-finite-view-convex-support",
              endCaps: "unobserved",
              interior: "unobserved",
              hiddenConcavities: "unobserved",
              cameras: "supplied",
              enclosure: "not-certified",
            },
          },
          cohort: observation.cohort,
          sources: observation.views.map(
            (
              view: (typeof observation.views)[number],
            ): { id: string; sha256: string } => ({
              id: view.id,
              sha256: view.sourceSha256,
            }),
          ),
          maximumResidualPx: residual,
          splineRankRatio: fit.rankRatio,
          counts: {
            rows: samples.length,
            spans: count,
            freeScalars: normals.length * (count + 3),
          },
          observedIntervalMm: [prepared.lower, prepared.upper],
          generation: {
            events: generated.events,
            intervals: generated.intervals,
            vertices: generated.mesh.positions.length / 3,
            maximumBoundaryDefectMeters: generated.maximumBoundaryDefectMeters,
          },
        },
      };
    }
    throw new Error(`support-fit-budget-exhausted: ${last}`);
  } catch (failure: unknown) {
    return {
      schema,
      operator,
      status: cancelled() ? "cancelled" : callback ? "failed" : "refused",
      diagnostics: [
        failure instanceof Error ? failure.message : String(failure),
      ],
    };
  }
}
