import type {
  IAutoMovieEllipticLoft,
  IAutoMovieRecoveryImageDirectionSolverCreationOperation,
  IAutoMovieRecoveryImageFit,
  IAutoMovieRecoveryImageFitPolicy,
  IAutoMovieRecoveryImageObservation,
  IAutoMovieRecoveryImageProfileSample,
  IAutoMovieRecoveryImageProfilesFittingOperation,
  IAutoMovieRecoveryImageSource,
  IAutoMovieRecoveryImageSupportsPreparationOperation,
  IAutoMovieRecoveryOptions,
  IAutoMovieRecoveryResult,
} from "@automovie/interface";

import { createRecoveryImageDirectionSolver } from "../../internal/createRecoveryImageDirectionSolver";
import { fitRecoveryImageProfiles } from "../../internal/fitRecoveryImageProfiles";
import { isRecoveryPositiveFinite } from "../../internal/isRecoveryPositiveFinite";
import { isRecoveryPositiveSafeInteger } from "../../internal/isRecoveryPositiveSafeInteger";
import { isRecoveryUnitInterval } from "../../internal/isRecoveryUnitInterval";
import { prepareRecoveryImageSupports } from "../../internal/prepareRecoveryImageSupports";

/**
 * Infer aligned elliptical sections from calibrated horizontal silhouette
 * supports. At each common physical Y, midpoint = cos(a) centreX + sin(a)
 * centreZ and halfWidth squared = cos(a) squared radiusX squared + sin(a)
 * squared radiusZ squared. These are support-function constraints; matching the
 * left or right contour across views as a material point would be incorrect.
 * Three distinct squared support directions permit an overdetermined family
 * check. Passed checks remain conditional on the stated ellipse prior and
 * supplied rigid camera calibration. Different row charts use piecewise linear
 * interpolation only within their common measured interval. No endpoint
 * extrapolation, inferred cap or unseen concavity is generated. Increasing
 * uniform cubic spline spaces are tried in order until every compared support
 * meets the pixel budget or maxSpans is exhausted.
 */
export function fitAutoMovieRecoveryImageLoft(
  observation: IAutoMovieRecoveryImageObservation,
  policy: IAutoMovieRecoveryImageFitPolicy,
  options: IAutoMovieRecoveryOptions = {},
): IAutoMovieRecoveryResult<IAutoMovieRecoveryImageFit> {
  const operator: IAutoMovieRecoveryResult<unknown>["operator"] =
    "image-elliptic-loft-v1";
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
        diagnostics: ["Cancelled before image fitting"],
      };

    if (
      !observation ||
      observation.method !== "fixed-background-channel-distance-v1" ||
      !observation.objectId.trim() ||
      !observation.frame.trim() ||
      !["analytic", "photograph", "inconsistent-stress"].includes(
        observation.cohort,
      ) ||
      !policy ||
      policy.family !== "aligned-elliptical-sections" ||
      !isRecoveryPositiveSafeInteger(policy.maxViews) ||
      !isRecoveryPositiveSafeInteger(policy.maxRows) ||
      !isRecoveryPositiveSafeInteger(policy.maxSpans) ||
      !isRecoveryPositiveFinite(policy.maximumResidualPx) ||
      !isRecoveryUnitInterval(policy.minimumDirectionRatio) ||
      !isRecoveryUnitInterval(policy.minimumSplineRatio) ||
      observation.views.length < 3 ||
      observation.views.length > policy.maxViews
    )
      throw new Error(
        "invalid-image-fit: explicit family, observations, residual/rank thresholds and finite budgets required",
      );
    const {
      lower,
      upper,
      directions,
      stations,
      supports,
    }: ReturnType<IAutoMovieRecoveryImageSupportsPreparationOperation.Operation> =
      prepareRecoveryImageSupports(observation, policy);
    const unique: number[] = [];
    for (const direction of directions) {
      const squared: number = direction.c * direction.c;
      if (
        !unique.some(
          (value: number): boolean =>
            Math.abs(value - squared) <= policy.minimumDirectionRatio,
        )
      )
        unique.push(squared);
    }
    if (unique.length < 3)
      throw new Error(
        "insufficient-directions: three separated squared-support directions are needed to test the family",
      );
    const radiiSolver: ReturnType<IAutoMovieRecoveryImageDirectionSolverCreationOperation.Operation> =
      createRecoveryImageDirectionSolver(
        directions.map(
          (direction: (typeof directions)[number]): [number, number] => [
            direction.c ** 2,
            direction.s ** 2,
          ],
        ),
        policy.minimumDirectionRatio,
      );
    const centreSolver: ReturnType<IAutoMovieRecoveryImageDirectionSolverCreationOperation.Operation> =
      createRecoveryImageDirectionSolver(
        directions.map(
          (direction: (typeof directions)[number]): [number, number] => [
            direction.c,
            direction.s,
          ],
        ),
        policy.minimumDirectionRatio,
      );
    let familyResidual: number = 0;
    const samples: IAutoMovieRecoveryImageProfileSample<
      [number, number, number, number]
    >[] = stations.map(
      (
        yMm: number,
        row: number,
      ): IAutoMovieRecoveryImageProfileSample<
        [number, number, number, number]
      > => {
        const squaredWidths: number[] = [],
          midpoints: number[] = [];
        for (let view: number = 0; view < directions.length; view++) {
          const measured: (typeof supports)[number][number] =
            supports[view][row];
          const half: number = (measured.upperMm - measured.lowerMm) / 2;
          const midpoint: number = measured.lowerMm / 2 + measured.upperMm / 2;
          squaredWidths.push(half ** 2);
          midpoints.push(midpoint);
        }
        const [rx2, rz2]: [number, number] = radiiSolver.solve(squaredWidths);
        const [centreX, centreZ]: [number, number] =
          centreSolver.solve(midpoints);
        if (!(rx2 > 0) || !(rz2 > 0))
          throw new Error(
            "inconsistent-support: section equations do not admit finite positive ellipse axes",
          );
        const values: [number, number, number, number] = [
          Math.sqrt(rx2),
          Math.sqrt(rz2),
          centreX,
          centreZ,
        ];
        for (let view: number = 0; view < directions.length; view++) {
          const direction: (typeof directions)[number] = directions[view];
          const half: number = Math.hypot(
            direction.c * values[0],
            direction.s * values[1],
          );
          const midpoint: number =
            direction.c * centreX + direction.s * centreZ;
          familyResidual = Math.max(
            familyResidual,
            Math.abs(midpoint - half - supports[view][row].lowerMm) /
              observation.views[view].camera.pixelPitchMm,
            Math.abs(midpoint + half - supports[view][row].upperMm) /
              observation.views[view].camera.pixelPitchMm,
          );
        }
        if (!(familyResidual <= policy.maximumResidualPx))
          throw new Error(
            `unsupported-family: section support residual at least ${familyResidual} px exceeds ${policy.maximumResidualPx} px`,
          );
        return { yMm, values };
      },
    );
    const evaluate: (
      loft: IAutoMovieEllipticLoft,
      yMm: number,
    ) => [number, number, number, number] = (
      loft: IAutoMovieEllipticLoft,
      yMm: number,
    ): [number, number, number, number] => {
      const y: number = yMm * 0.001;
      const span: IAutoMovieEllipticLoft["spans"][number] =
        loft.spans.find(
          (candidate: IAutoMovieEllipticLoft["spans"][number]): boolean =>
            y <= candidate.interval[1],
        ) ?? loft.spans[loft.spans.length - 1];
      const t: number =
        (y - span.interval[0]) / (span.interval[1] - span.interval[0]);
      const weights: number[] = [
        (1 - t) ** 3,
        3 * t * (1 - t) ** 2,
        3 * t * t * (1 - t),
        t ** 3,
      ];
      const evaluate = (
        field: "radiusX" | "radiusZ" | "centreX" | "centreZ",
      ): number =>
        1000 *
        span[field].reduce(
          (sum: number, control: number, index: number): number =>
            sum + weights[index] * control,
          0,
        );
      return [
        evaluate("radiusX"),
        evaluate("radiusZ"),
        evaluate("centreX"),
        evaluate("centreZ"),
      ];
    };
    let last: string = "maximum span count exhausted";
    for (
      let spans: number = 1;
      spans <= policy.maxSpans && spans + 3 <= samples.length;
      spans++
    ) {
      if (cancelled())
        return {
          operator,
          status: "cancelled",
          diagnostics: ["Cancelled between profile candidates"],
        };
      let candidate: ReturnType<IAutoMovieRecoveryImageProfilesFittingOperation.Operation>;
      try {
        candidate = fitRecoveryImageProfiles(
          samples,
          spans,
          policy.minimumSplineRatio,
        );
      } catch (failure: unknown) {
        if (
          !(failure instanceof Error) ||
          !failure.message.startsWith("unsupported-profile:")
        )
          throw failure;
        last = failure.message;
        continue;
      }
      let residual: number = 0;
      for (let row: number = 0; row < stations.length; row++) {
        const fitted: [number, number, number, number] = evaluate(
          candidate.loft,
          stations[row],
        );
        for (let view: number = 0; view < directions.length; view++) {
          const direction: (typeof directions)[number] = directions[view];
          const half: number = Math.hypot(
            direction.c * fitted[0],
            direction.s * fitted[1],
          );
          const midpoint: number =
            direction.c * fitted[2] + direction.s * fitted[3];
          residual = Math.max(
            residual,
            Math.abs(midpoint - half - supports[view][row].lowerMm) /
              observation.views[view].camera.pixelPitchMm,
            Math.abs(midpoint + half - supports[view][row].upperMm) /
              observation.views[view].camera.pixelPitchMm,
          );
        }
      }
      callback = true;
      options.onProgress?.("image-profile-candidate", spans, policy.maxSpans);
      callback = false;
      if (cancelled())
        return {
          operator,
          status: "cancelled",
          diagnostics: ["Cancelled before fit transfer"],
        };
      if (!(residual <= policy.maximumResidualPx)) {
        last = `support residual ${residual} px`;
        continue;
      }
      const diagnostics: string[] = [
        "Lateral surface is inferred under the aligned elliptical-section prior; silhouettes do not observe hidden concavities or interior structure",
        "Only the common row-centre interval is generated; end caps and noncommon image regions remain unobserved",
        "Supplied cameras and asserted rigidity are inputs, not estimated or independently verified results",
        "Different row charts use within-domain linear support interpolation; reported residuals are conditional on segmentation and calibration",
      ];
      return {
        operator,
        status: "partial",
        diagnostics,
        value: {
          recipe: {
            family: policy.family,
            objectId: observation.objectId,
            frame: observation.frame,
            loft: candidate.loft,
            dimensions: { widthScale: 1, depthScale: 1, heightScale: 1 },
            coverage: {
              lateralSurface: "inferred-under-aligned-ellipse-prior",
              endCaps: "unobserved",
              interior: "unobserved",
              cameras: "supplied",
            },
          },
          cohort: observation.cohort,
          sources: observation.views.map(
            (
              view: IAutoMovieRecoveryImageObservation["views"][number],
            ): IAutoMovieRecoveryImageSource => ({
              id: view.id,
              sha256: view.sourceSha256,
            }),
          ),
          maximumResidualPx: residual,
          familyResidualPx: familyResidual,
          directionRank: {
            radii: radiiSolver.ratio,
            centres: centreSolver.ratio,
          },
          splineRankRatio: candidate.rankRatio,
          counts: {
            rows: stations.length,
            spans,
            freeScalars: 4 * (spans + 3),
          },
          observedIntervalMm: [lower, upper],
          diagnostics,
        },
      };
    }
    throw new Error(
      `fit-budget-exhausted: ${last}; no candidate met every support constraint`,
    );
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
