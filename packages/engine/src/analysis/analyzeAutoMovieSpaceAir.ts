import {
  IAutoMovieAnalysisMetric,
  IAutoMovieAnalysisMetricGap,
  IAutoMovieAnalysisRun,
  IAutoMovieAnalysisWarning,
} from "@automovie/interface";

import { IAutoMovieSpaceAirRequest } from "./IAutoMovieSpaceAirRequest";
import { assertAutoMovieAnalysisTargets } from "./assertAutoMovieAnalysisTargets";
import { autoMovieAnalysisMetric } from "./autoMovieAnalysisMetric";
import { autoMovieAnalysisSettingsTargets } from "./autoMovieAnalysisSettingsTargets";
import { sealAutoMovieAnalysisRun } from "./sealAutoMovieAnalysisRun";
import { warnAutoMovieAnalysisTargetKeys } from "./warnAutoMovieAnalysisTargetKeys";

/**
 * Solve one space for ventilation, and refuse to pretend it solved the air.
 *
 * What a well-mixed zone model can answer, it answers exactly: the air change
 * rate `n = 3600 * Q / V`, the outdoor air per person `1000 * Q / N`, and the
 * steady-state contaminant balance `C = Co + 1e6 * N * G / Q`. Those are
 * closed-form and are checked against hand arithmetic.
 *
 * What it cannot answer, it refuses to. Air stagnation and a velocity field are
 * properties of a flow solution, and no amount of zone arithmetic produces one,
 * so both are `unsupported` metrics naming exactly what is missing. This is the
 * whole point of the contract: the honest answer to "where does the air sit
 * still" is that this host does not know, and a number invented here would be
 * indistinguishable from one that was computed.
 *
 * A zero supply flow leaves the steady-state concentration a gap whose reason
 * depends on the generation `N * G`: with occupants generating carbon dioxide
 * it rises without bound, and with none it stays wherever it starts, so no
 * steady state is unique either way.
 *
 * Throws on a malformed request (see {@link IAutoMovieSpaceAirRequest}). The
 * returned run is always `solved` and carries no spatial samples.
 *
 * Finite admitted inputs can still overflow or underflow intermediate arithmetic; a nonfinite metric throws through the shared builder instead of becoming a fabricated measurement.
 *
 * @evidence contracts/common.md#principled-implementation Evaluates the well-mixed single-zone balance in closed form (air change rate, outdoor air per person, steady-state carbon dioxide), whose premise is uniform concentration in the zone, and reports velocity and stagnation as `unsupported` because a zone model has no flow field.
 * @evidence contracts/common.md#clear-and-simple-design One function validates, evaluates five metrics through the shared metric builder and seals one run; the request check is a private helper because only this analyzer reads a ventilation request.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A null flow, a zero flow and zero occupancy each produce a named gap instead of a substituted value, and the zero-flow reason is chosen from whether anything generates carbon dioxide rather than assuming an occupied space.
 * @evidence contracts/common.md#meaningful-documentation The documentation states the three closed forms, why velocity and stagnation are unsupported, both zero-flow cases, the throwing inputs and that the run is always solved without samples.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Constant arithmetic for five metrics plus target validation and matching linear in the declared targets, with no algorithm or strategy to choose.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One request yields one run; nothing it computes serves another request or phase.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Builds five metrics, a warning list and one settings string for the sealed run and retains nothing after returning it.
 * @author Samchon
 */
export const analyzeAutoMovieSpaceAir: (props: {
  request: IAutoMovieSpaceAirRequest;
}) => IAutoMovieAnalysisRun = (props: {
  /** Study to solve; validated in full before any arithmetic. */
  request: IAutoMovieSpaceAirRequest;
}): IAutoMovieAnalysisRun => {
  const request: IAutoMovieSpaceAirRequest = props.request;
  validateAirRequest(request);
  const warnings: IAutoMovieAnalysisWarning[] = [];
  const flow: number | null = request.supplyFlow;
  const generation: number = request.occupants * request.occupantCarbonDioxide;
  const noFlow: IAutoMovieAnalysisMetricGap = {
    reason:
      "the space declares no mechanical outdoor-air supply, so no ventilation rate exists to report",
    remedy:
      "declare the supply flow the space is ventilated at, or record an infiltration study as its own run",
  };
  const air: (
    key: string,
    unit: string,
    value: number | null,
    gap?: IAutoMovieAnalysisMetricGap,
    status?: "unsupported" | "not-run",
  ) => IAutoMovieAnalysisMetric = (
    key: string,
    unit: string,
    value: number | null,
    gap?: IAutoMovieAnalysisMetricGap,
    status?: "unsupported" | "not-run",
  ): IAutoMovieAnalysisMetric =>
    autoMovieAnalysisMetric({
      key,
      unit,
      value,
      targets: request.targets,
      warnings,
      gap,
      status,
    });
  const metrics: IAutoMovieAnalysisMetric[] = [
    air(
      "space.airChangeRate",
      "1/h",
      flow === null ? null : (flow * 3600) / request.volume,
      flow === null ? noFlow : undefined,
    ),
    air(
      "space.freshAirPerOccupant",
      "L/(s*person)",
      flow === null || request.occupants === 0
        ? null
        : (flow * 1000) / request.occupants,
      flow === null
        ? noFlow
        : request.occupants === 0
          ? {
              reason:
                "the space declares no occupants, so outdoor air per person is undefined",
              remedy:
                "declare the occupancy the ventilation is designed for, or judge the space by its air change rate",
            }
          : undefined,
    ),
    air(
      "space.carbonDioxide.steadyState",
      "ppm",
      flow === null || flow === 0
        ? null
        : request.outdoorCarbonDioxide +
            (1e6 * request.occupants * request.occupantCarbonDioxide) / flow,
      flow === null
        ? noFlow
        : flow === 0
          ? generation === 0
            ? {
                reason:
                  "the space declares a supply flow of 0 m3/s and generates no carbon dioxide, so its concentration stays wherever it starts and has no unique steady state",
                remedy:
                  "declare the outdoor-air flow the space is actually ventilated at",
              }
            : {
                reason:
                  "the space declares a supply flow of 0 m3/s while its occupants generate carbon dioxide, so the concentration rises without bound and reaches no steady state",
                remedy:
                  "declare the outdoor-air flow the space is actually ventilated at",
              }
          : undefined,
    ),
    air(
      "space.airVelocity.mean",
      "m/s",
      null,
      {
        reason:
          "this host solves a well-mixed zone balance and computes no flow field, so air speed inside the space is not known",
        remedy:
          "bind a computational fluid dynamics adapter and record its result as its own run",
      },
      "unsupported",
    ),
    air(
      "space.stagnationVolumeFraction",
      "ratio",
      null,
      {
        reason:
          "stagnation is a property of a velocity field, and this host computes none; a zone air change rate cannot locate still air",
        remedy:
          "bind a computational fluid dynamics adapter and record its result as its own run",
      },
      "unsupported",
    ),
  ];
  warnAutoMovieAnalysisTargetKeys({
    targets: request.targets,
    keys: metrics.map((entry: IAutoMovieAnalysisMetric): string => entry.key),
    warnings,
  });
  return sealAutoMovieAnalysisRun({
    id: request.id,
    domain: "air",
    subject: request.subject,
    inputRevision: request.inputRevision,
    solver: {
      id: "automovie.air.well-mixed-zone",
      version: "1",
      model:
        "well-mixed single-zone balance n=3600Q/V, per-person 1000Q/N, steady-state C=Co+1e6*N*G/Q; no flow field, so stagnation and air speed are unsupported",
    },
    settings: JSON.stringify({
      volume: request.volume,
      supplyFlow: request.supplyFlow,
      occupants: request.occupants,
      occupantCarbonDioxide: request.occupantCarbonDioxide,
      outdoorCarbonDioxide: request.outdoorCarbonDioxide,
      targets: autoMovieAnalysisSettingsTargets(request.targets),
    }),
    outcome: { status: "solved", metrics, samples: [], warnings },
  });
};

/**
 * Check nonblank header strings, positive volume, null/nonnegative flow, safe nonnegative occupancy and finite nonnegative carbon-dioxide inputs before target admission. Throws at the first defect; nested typed-record shape is a premise and derived arithmetic is not certified.
 *
 * One fixed field pass plus the shared target scan uses target-proportional temporary ids and retains no request or verdict after return or throw.
 */
const validateAirRequest: (request: IAutoMovieSpaceAirRequest) => void = (
  request: IAutoMovieSpaceAirRequest,
): void => {
  for (const [label, value] of [
    ["id", request.id],
    ["subject", request.subject],
    ["input revision", request.inputRevision],
  ] as const)
    if (value.trim().length === 0)
      throw new Error(`a ventilation study must state a non-blank ${label}`);
  if (!Number.isFinite(request.volume) || request.volume <= 0)
    throw new Error(
      `a ventilated space volume must be a finite number above zero, but was ${request.volume}`,
    );
  if (
    request.supplyFlow !== null &&
    (!Number.isFinite(request.supplyFlow) || request.supplyFlow < 0)
  )
    throw new Error(
      `a supply flow must be null or a finite number at or above zero, but was ${request.supplyFlow}`,
    );
  if (!Number.isSafeInteger(request.occupants) || request.occupants < 0)
    throw new Error(
      `an occupancy must be a whole number at or above zero, but was ${request.occupants}`,
    );
  for (const key of ["occupantCarbonDioxide", "outdoorCarbonDioxide"] as const)
    if (!Number.isFinite(request[key]) || request[key] < 0)
      throw new Error(
        `${key} must be a finite number at or above zero, but was ${request[key]}`,
      );
  assertAutoMovieAnalysisTargets(request.targets);
};
