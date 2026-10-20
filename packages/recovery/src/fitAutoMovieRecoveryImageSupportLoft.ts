import { createAutoMovieSupportSectionQuery } from "@automovie/engine/geometry/createAutoMovieSupportSectionQuery";
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
 * @evidence contracts/performance.md#reuse-equivalent-work One common chart and fixed-direction section query serve every candidate; one factorization serves all 2V fields. A reusable offset vector is overwritten before each synchronous query, which retains no offsets. Each returned section is copied once into call-local binary64 coordinate scratch for indexed projection scans; each view's exact opposite normals share that scan while both offset and implied-support residuals remain checked. A maximum residual can only grow, so one violating row rejects that candidate without scanning its remaining rows; acceptance still checks every row and view. Per-row Bernstein weights are shared, and accepted engine diagnostics retain no acquisition-time mesh.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Local observation, fit and temporary engine scratch expires synchronously; only compact coefficients, source identities and scalar diagnostics transfer. The coordinate buffer holds at most two scalars per plane pair, bounding every section query's possible output; the offset vector holds 2V scalars. Both are call-owned and reused without retaining rows or query output. Cancellation is checked between candidates and before transfer, with no file, worker or global cache acquired.
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
    const query: ReturnType<typeof createAutoMovieSupportSectionQuery> =
      createAutoMovieSupportSectionQuery({
        normals,
        minimumDirectionSine: policy.generation.minimumDirectionSine,
      });
    const offsets: number[] = new Array<number>(normals.length);
    const coordinates: Float64Array = new Float64Array(
      normals.length * (normals.length - 1),
    );
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
        const u: number = 1 - t;
        const w0: number = u * u * u,
          w1: number = 3 * t * u * u,
          w2: number = 3 * t * t * u,
          w3: number = t * t * t;
        for (let plane: number = 0; plane < normals.length; plane++) {
          const q: number[] = span.offsets[plane];
          offsets[plane] = q[0] * w0 + q[1] * w1 + q[2] * w2 + q[3] * w3;
        }
        const section: ReturnType<typeof query> = query(offsets);
        for (let vertex: number = 0; vertex < section.length; vertex++) {
          coordinates[2 * vertex] = section[vertex].point[0];
          coordinates[2 * vertex + 1] = section[vertex].point[1];
        }
        for (let view: number = 0; view < observation.views.length; view++) {
          const opposite: number = view + observation.views.length;
          const nx: number = normals[view][0],
            nz: number = normals[view][1];
          let upper: number = -Infinity,
            negativeLower: number = -Infinity;
          for (let vertex: number = 0; vertex < section.length; vertex++) {
            // The second field uses the exact negative of this fixed normal.
            // One projection therefore supplies both directional extrema.
            const projection: number =
              nx * coordinates[2 * vertex] + nz * coordinates[2 * vertex + 1];
            upper = Math.max(upper, projection);
            negativeLower = Math.max(negativeLower, -projection);
          }
          const pitch: number = observation.views[view].camera.pixelPitchMm;
          residual = Math.max(
            residual,
            Math.abs(1000 * offsets[view] - samples[row].values[view]) / pitch,
            Math.abs(1000 * upper - samples[row].values[view]) / pitch,
            Math.abs(1000 * offsets[opposite] - samples[row].values[opposite]) /
              pitch,
            Math.abs(1000 * negativeLower - samples[row].values[opposite]) /
              pitch,
          );
        }
        if (!(residual <= policy.maximumResidualPx)) break;
      }
      callback = true;
      options.onProgress?.("support-profile-candidate", count, policy.maxSpans);
      callback = false;
      if (!(residual <= policy.maximumResidualPx)) {
        last = `Implied support residual at least ${residual} px`;
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
