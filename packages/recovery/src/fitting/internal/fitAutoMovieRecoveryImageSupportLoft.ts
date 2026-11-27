import { AutoMovieEngineConvexSupportLoft, AutoMovieEngineGeometry } from "@automovie/engine";
import type {
  IAutoMovieConvexSupportLoft,
  IAutoMovieRealizeConvexSupportLoft,
  IAutoMovieRecoveryImageObservation,
  IAutoMovieRecoveryImageProfileSample,
  IAutoMovieRecoveryImageSource,
  IAutoMovieRecoveryImageSupportsPreparationOperation,
  IAutoMovieRecoveryOptions,
  IAutoMovieRecoveryResult,
  IAutoMovieRecoveryScalarProfilesFittingOperation,
  IAutoMovieRecoverySupportFit,
  IAutoMovieRecoverySupportFitPolicy,
} from "@automovie/interface";

import { AutoMovieRecoveryProfileFitting } from "../AutoMovieRecoveryProfileFitting";
import { isRecoveryPositiveFinite } from "../../internal/isRecoveryPositiveFinite";
import { isRecoveryPositiveSafeInteger } from "../../internal/isRecoveryPositiveSafeInteger";
import { isRecoveryUnitInterval } from "../../internal/isRecoveryUnitInterval";
import { prepareRecoveryImageSupports } from "../../geometry/internal/prepareRecoveryImageSupports";

/**
 * Fit compact continuous support profiles from supplied-camera image envelopes.
 * Every view supplies two oriented inequalities, not a corresponding material
 * contour. Increasing common cubic spaces are tried in order. Both offset fits
 * and the implied polygon's supports must meet every common-domain observation;
 * engine admission qualifies feasible active-boundary changes before transfer.
 * The finite-view section hull cannot identify hidden concavity or interior.
 * Segmentation/calibration uncertainty prevents a certified true enclosure.
 */
export function fitAutoMovieRecoveryImageSupportLoft(
  observation: IAutoMovieRecoveryImageObservation,
  policy: IAutoMovieRecoverySupportFitPolicy,
  options: IAutoMovieRecoveryOptions = {},
): IAutoMovieRecoveryResult<IAutoMovieRecoverySupportFit> {
  const operator: IAutoMovieRecoveryResult<unknown>["operator"] =
    "image-support-loft-v1";
  let cancellationRequested: boolean = false;
  let cancellationCallback: boolean = false;
  let callback: boolean = false;
  let probe: (() => boolean) | undefined;
  const cancelled: () => boolean = (): boolean => {
    cancellationCallback = true;
    const requested: boolean | undefined = probe?.();
    cancellationCallback = false;
    cancellationRequested = requested === true;
    return cancellationRequested;
  };
  try {
    probe = options.cancelled;

    if (cancelled())
      return {
        operator,
        status: "cancelled",
        diagnostics: ["Cancelled before support fitting"],
      };

    if (
      !policy ||
      policy.family !== "finite-view-convex-support" ||
      !isRecoveryPositiveSafeInteger(policy.maxViews) ||
      !isRecoveryPositiveSafeInteger(policy.maxRows) ||
      !isRecoveryPositiveSafeInteger(policy.maxSpans) ||
      !isRecoveryPositiveFinite(policy.maximumResidualPx) ||
      !isRecoveryUnitInterval(policy.minimumSplineRatio) ||
      !policy.generation ||
      !AutoMovieEngineConvexSupportLoft.isValidControls(policy.generation)
    )
      throw new Error(
        "invalid-support-fit: explicit family, residual/rank and generation budgets required",
      );
    const prepared: ReturnType<IAutoMovieRecoveryImageSupportsPreparationOperation.Operation> =
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
    const query: ReturnType<typeof AutoMovieEngineGeometry.createSupportSectionQuery> =
      AutoMovieEngineGeometry.createSupportSectionQuery({
        normals,
        minimumDirectionSine: policy.generation.minimumDirectionSine,
      });
    const offsets: number[] = new Array<number>(normals.length);
    const coordinates: Float64Array = new Float64Array(
      normals.length * (normals.length - 1),
    );
    const samples: IAutoMovieRecoveryImageProfileSample[] =
      prepared.stations.map(
        (yMm: number, row: number): IAutoMovieRecoveryImageProfileSample => ({
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
          operator,
          status: "cancelled",
          diagnostics: ["Cancelled between support candidates"],
        };
      const fit: ReturnType<IAutoMovieRecoveryScalarProfilesFittingOperation.Operation> =
        AutoMovieRecoveryProfileFitting.fitScalarProfiles(samples, count, policy.minimumSplineRatio);
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
      const generated: IAutoMovieRealizeConvexSupportLoft.IResult =
        AutoMovieEngineConvexSupportLoft.realize({
          ...policy.generation,
          loft,
          topologyDomain: `support-fit:${observation.objectId}`,
        });
      if (cancelled())
        return {
          operator,
          status: "cancelled",
          diagnostics: ["Cancelled before support fit transfer"],
        };
      return {
        operator,
        status: "partial",
        diagnostics: [
          "Finite-view convex section approximation with supplied cameras and asserted rigidity; hidden concavity, caps and interior remain unobserved",
          "Common-domain interpolation and fitted supports are conditional on segmentation/calibration; true enclosure is not certified",
          "Boundary events and canonical incidence are binary64 numerical constructions, not interval certificates",
        ],
        value: {
          recipe: {
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
            ): IAutoMovieRecoveryImageSource => ({
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
      operator,
      status: cancellationRequested
        ? "cancelled"
        : cancellationCallback || callback
          ? "failed"
          : "refused",
      diagnostics: [
        failure instanceof Error ? failure.message : String(failure),
      ],
    };
  }
}
