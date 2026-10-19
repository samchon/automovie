import type { IAutoMovieEllipticLoft } from "@automovie/interface";
import type { IAutoMovieRecoveryImageObservation } from "@automovie/interface/recovery";

import type { IAutoMovieRecoveryImageFit } from "./IAutoMovieRecoveryImageFit";
import type { IAutoMovieRecoveryOperation } from "./IAutoMovieRecoveryOperation";
import { assertRecoveryImageChart } from "./internal/assertRecoveryImageChart";
import { createRecoveryImageDirectionSolver } from "./internal/createRecoveryImageDirectionSolver";
import { fitRecoveryImageProfiles } from "./internal/fitRecoveryImageProfiles";

/**
 * Infer aligned elliptical sections from calibrated horizontal silhouette supports.
 * At each common physical Y, midpoint = cos(a) centreX + sin(a) centreZ and
 * halfWidth squared = cos(a) squared radiusX squared + sin(a) squared radiusZ squared.
 * These are support-function constraints; matching the left or right contour
 * across views as a material point would be incorrect. Three distinct squared
 * support directions permit an overdetermined family check. Passed checks remain
 * conditional on the stated ellipse prior and supplied rigid camera calibration.
 * Different row charts use piecewise linear interpolation only within their common
 * measured interval. No endpoint extrapolation, inferred cap or unseen concavity
 * is generated. Increasing uniform cubic spline spaces are tried in order until
 * every compared support meets the pixel budget or maxSpans is exhausted.
 *
 * @evidence contracts/common.md#principled-implementation Unweighted two-column linear section equations establish centre and squared-radius initial observations under the explicit aligned-ellipse hypothesis. Direction singular-value ratios reject weak geometry before Householder cubic fitting; all original in-common-domain rows participate in the union chart and final pixel-residual check.
 * @evidence contracts/common.md#clear-and-simple-design This owner coordinates qualified camera support, physical row interpolation and bounded profile candidates; the profile helper owns spline algebra and the engine owns recipe-to-atlas geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No contour-point triangulation, copied mesh, manually placed curve, fixture coefficient or hidden completion supplies a result. Contradictory support, nonpositive radii, inadequate directions and exhausted fit budgets refuse rather than increasing a budget or silently dropping observations.
 * @evidence contracts/common.md#meaningful-documentation Gives projection/support equations, family and camera assumptions, interpolation domain, rank limits, fit termination, pixel residual meaning and explicit unobserved regions.
 * @evidence contracts/performance.md#efficient-algorithms For V views and R total rows, admission and union sorting cost O(R log R). N common stations cost O(N V), and trying S=1 through maxSpans costs the sum of O(N (S+3) squared) QR work. All loops are bounded by caller-supplied maxViews, maxRows and maxSpans before candidate allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work Camera trigonometry, two direction QR factorizations and interpolated support are reused across all spline candidates; each candidate factors one basis for all four fields.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Local O(N V) support and O(N (maxSpans+3)) fit scratch expire synchronously. Only compact coefficients, source identities and scalar diagnostics transfer to the caller; no image arrays, file handles or global cache remain.
 */
export function fitAutoMovieRecoveryImageLoft(
  observation: IAutoMovieRecoveryImageObservation,
  policy: {
    family: "aligned-elliptical-sections";
    maxViews: number;
    maxRows: number;
    maxSpans: number;
    maximumResidualPx: number;
    minimumDirectionRatio: number;
    minimumSplineRatio: number;
  },
  options: IAutoMovieRecoveryOperation.Options = {},
): IAutoMovieRecoveryOperation.Result<IAutoMovieRecoveryImageFit> {
  const schema: "automovie-recovery-operation-v1" =
    "automovie-recovery-operation-v1";
  const operator: "image-elliptic-loft-v1" = "image-elliptic-loft-v1";
  const cancelled: () => boolean = (): boolean =>
    options.signal?.aborted === true;
  if (cancelled())
    return {
      schema,
      operator,
      status: "cancelled",
      diagnostics: ["Cancelled before image fitting"],
    };
  let callback: boolean = false;
  try {
    if (
      !observation ||
      observation.schema !== "automovie-recovery-image-support-v1" ||
      observation.method !== "fixed-background-channel-distance-v1" ||
      typeof observation.objectId !== "string" ||
      !observation.objectId.trim() ||
      typeof observation.frame !== "string" ||
      !observation.frame.trim() ||
      !["analytic", "photograph", "inconsistent-stress"].includes(
        observation.cohort,
      ) ||
      !policy ||
      policy.family !== "aligned-elliptical-sections" ||
      ![policy.maxViews, policy.maxRows, policy.maxSpans].every(
        (value: number): boolean => Number.isSafeInteger(value) && value > 0,
      ) ||
      !Number.isFinite(policy.maximumResidualPx) ||
      policy.maximumResidualPx <= 0 ||
      ![policy.minimumDirectionRatio, policy.minimumSplineRatio].every(
        (value: number): boolean =>
          Number.isFinite(value) && value > 0 && value < 1,
      ) ||
      !Array.isArray(observation.views) ||
      observation.views.length < 3 ||
      observation.views.length > policy.maxViews
    )
      throw new Error(
        "invalid-image-fit: explicit family, observations, residual/rank thresholds and finite budgets required",
      );
    const names: Set<string> = new Set();
    let rowCount: number = 0,
      lower: number = -Infinity,
      upper: number = Infinity;
    for (let index: number = 0; index < observation.views.length; index++) {
      const view: IAutoMovieRecoveryImageObservation["views"][number] =
        observation.views[index];
      if (
        !view ||
        typeof view.id !== "string" ||
        !view.id ||
        names.has(view.id) ||
        typeof view.sourceSha256 !== "string" ||
        !/^[a-f0-9]{64}$/i.test(view.sourceSha256) ||
        typeof view.pixelProvenance !== "string" ||
        !view.pixelProvenance ||
        !Number.isSafeInteger(view.width) ||
        view.width < 1 ||
        !Number.isSafeInteger(view.height) ||
        view.height < 1 ||
        !view.camera ||
        view.camera.type !== "horizontal-orthographic" ||
        view.camera.calibration !== "supplied" ||
        !Number.isFinite(view.camera.azimuthRadians) ||
        !Number.isFinite(view.camera.pixelPitchMm) ||
        view.camera.pixelPitchMm <= 0 ||
        !Array.isArray(view.camera.principalPointPx) ||
        view.camera.principalPointPx.length !== 2 ||
        !Number.isFinite(view.camera.principalPointPx[0]) ||
        !Number.isFinite(view.camera.principalPointPx[1]) ||
        view.quantizationMm !== view.camera.pixelPitchMm / 2 ||
        !Array.isArray(view.rows) ||
        view.rows.length < 4
      )
        throw new Error(
          `invalid-observation: supplied camera and dense support rows required at ${index}`,
        );
      rowCount += view.rows.length;
      if (!Number.isSafeInteger(rowCount) || rowCount > policy.maxRows)
        throw new Error("budget-exhausted: observed rows exceed maxRows");
      names.add(view.id);
      const chart: ReturnType<typeof assertRecoveryImageChart> =
        assertRecoveryImageChart(view);
      for (let row: number = 0; row < view.rows.length; row++) {
        const current: (typeof view.rows)[number] = view.rows[row];
        if (
          !current ||
          !Number.isFinite(current.yMm) ||
          !Number.isFinite(current.lowerMm) ||
          !Number.isFinite(current.upperMm) ||
          !(current.lowerMm < current.upperMm) ||
          (row > 0 && !(view.rows[row - 1].yMm < current.yMm))
        )
          throw new Error(
            "invalid-observation: finite, ordered, positive-width support rows required",
          );
        chart.assertRow(current, row > 0 ? view.rows[row - 1].yMm : undefined);
      }
      lower = Math.max(lower, view.rows[0].yMm);
      upper = Math.min(upper, view.rows.at(-1)!.yMm);
    }
    if (!(lower < upper) || !Number.isFinite(upper - lower))
      throw new Error(
        "missing-common-support: views have no shared finite physical station interval",
      );
    const directions: { c: number; s: number }[] = observation.views.map(
      (
        view: IAutoMovieRecoveryImageObservation["views"][number],
      ): { c: number; s: number } => ({
        c: Math.cos(view.camera.azimuthRadians),
        s: Math.sin(view.camera.azimuthRadians),
      }),
    );
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
    const radiiSolver: ReturnType<typeof createRecoveryImageDirectionSolver> =
      createRecoveryImageDirectionSolver(
        directions.map(
          (direction: (typeof directions)[number]): [number, number] => [
            direction.c ** 2,
            direction.s ** 2,
          ],
        ),
        policy.minimumDirectionRatio,
      );
    const centreSolver: ReturnType<typeof createRecoveryImageDirectionSolver> =
      createRecoveryImageDirectionSolver(
        directions.map(
          (direction: (typeof directions)[number]): [number, number] => [
            direction.c,
            direction.s,
          ],
        ),
        policy.minimumDirectionRatio,
      );
    const stations: number[] = [
      ...new Set(
        observation.views.flatMap(
          (
            view: IAutoMovieRecoveryImageObservation["views"][number],
          ): number[] =>
            view.rows
              .filter(
                (row: (typeof view.rows)[number]): boolean =>
                  row.yMm >= lower && row.yMm <= upper,
              )
              .map((row: (typeof view.rows)[number]): number => row.yMm),
        ),
      ),
    ].sort((a: number, b: number): number => a - b);
    if (stations.length < 4)
      throw new Error(
        "insufficient-common-support: four common-domain stations required",
      );
    const supports: { lowerMm: number; upperMm: number }[][] =
      observation.views.map(
        (
          view: IAutoMovieRecoveryImageObservation["views"][number],
        ): { lowerMm: number; upperMm: number }[] => {
          let cursor: number = 0;
          return stations.map(
            (station: number): { lowerMm: number; upperMm: number } => {
              while (
                cursor + 1 < view.rows.length &&
                view.rows[cursor + 1].yMm < station
              )
                cursor++;
              const a: (typeof view.rows)[number] = view.rows[cursor],
                b: (typeof view.rows)[number] =
                  view.rows[Math.min(cursor + 1, view.rows.length - 1)];
              const t: number =
                a.yMm === b.yMm ? 0 : (station - a.yMm) / (b.yMm - a.yMm);
              return {
                lowerMm: a.lowerMm * (1 - t) + b.lowerMm * t,
                upperMm: a.upperMm * (1 - t) + b.upperMm * t,
              };
            },
          );
        },
      );
    let familyResidual: number = 0;
    const samples: { yMm: number; values: [number, number, number, number] }[] =
      stations.map(
        (
          yMm: number,
          row: number,
        ): { yMm: number; values: [number, number, number, number] } => {
          const squaredWidths: number[] = [],
            midpoints: number[] = [];
          for (let view: number = 0; view < directions.length; view++) {
            const measured: (typeof supports)[number][number] =
              supports[view][row];
            const half: number = (measured.upperMm - measured.lowerMm) / 2;
            const midpoint: number =
              measured.lowerMm / 2 + measured.upperMm / 2;
            squaredWidths.push(half ** 2);
            midpoints.push(midpoint);
          }
          const [rx2, rz2]: [number, number] = radiiSolver.solve(squaredWidths);
          const [centreX, centreZ]: [number, number] =
            centreSolver.solve(midpoints);
          if (
            !(rx2 > 0) ||
            !(rz2 > 0) ||
            ![rx2, rz2, centreX, centreZ].every(Number.isFinite)
          )
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
          return { yMm, values };
        },
      );
    if (!(familyResidual <= policy.maximumResidualPx))
      throw new Error(
        `unsupported-family: section support residual ${familyResidual} px exceeds ${policy.maximumResidualPx} px`,
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
        ) ?? loft.spans.at(-1)!;
      const t: number =
        (y - span.interval[0]) / (span.interval[1] - span.interval[0]);
      const weights: number[] = [
        (1 - t) ** 3,
        3 * t * (1 - t) ** 2,
        3 * t * t * (1 - t),
        t ** 3,
      ];
      return (["radiusX", "radiusZ", "centreX", "centreZ"] as const).map(
        (field: "radiusX" | "radiusZ" | "centreX" | "centreZ"): number =>
          1000 *
          span[field].reduce(
            (sum: number, control: number, index: number): number =>
              sum + weights[index] * control,
            0,
          ),
      ) as [number, number, number, number];
    };
    let last: string = "maximum span count exhausted";
    for (
      let spans: number = 1;
      spans <= policy.maxSpans && spans + 3 <= samples.length;
      spans++
    ) {
      if (cancelled())
        return {
          schema,
          operator,
          status: "cancelled",
          diagnostics: ["Cancelled between profile candidates"],
        };
      let candidate: ReturnType<typeof fitRecoveryImageProfiles>;
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
          schema,
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
        schema,
        operator,
        status: "partial",
        diagnostics,
        value: {
          recipe: {
            schema: "automovie-recovery-image-loft-v1",
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
            ): { id: string; sha256: string } => ({
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
      schema,
      operator,
      status: cancelled() ? "cancelled" : callback ? "failed" : "refused",
      diagnostics: [
        failure instanceof Error ? failure.message : String(failure),
      ],
    };
  }
}
