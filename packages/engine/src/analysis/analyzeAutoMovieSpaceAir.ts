import { IAutoMovieAnalysisMetric, IAutoMovieAnalysisMetricGap, IAutoMovieAnalysisRun, IAutoMovieAnalysisWarning } from "@automovie/interface";
import { autoMovieAnalysisMetric } from "./autoMovieAnalysisMetric";
import { sealAutoMovieAnalysisRun } from "./sealAutoMovieAnalysisRun";
import { warnAutoMovieAnalysisTargetKeys } from "./warnAutoMovieAnalysisTargetKeys";
import { IAutoMovieSpaceAirRequest } from "./IAutoMovieSpaceAirRequest";

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
 * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment `analyzeAutoMovieSpaceAir` computes bounded zone ventilation and carbon-dioxide capacity while explicitly refusing stagnation and velocity-field claims.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract The solver validates the declared zone state, evaluates its three closed forms, records unsupported flow outcomes, and seals one air-domain run.
 * @author Samchon
 */
export const analyzeAutoMovieSpaceAir = (props: {
  request: IAutoMovieSpaceAirRequest;
}): IAutoMovieAnalysisRun => {
  const request = props.request;
  validateAirRequest(request);
  const warnings: IAutoMovieAnalysisWarning[] = [];
  const flow = request.supplyFlow;
  const noFlow: IAutoMovieAnalysisMetricGap = {
    reason:
      "the space declares no mechanical outdoor-air supply, so no ventilation rate exists to report",
    remedy:
      "declare the supply flow the space is ventilated at, or record an infiltration study as its own run",
  };
  const air = (
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
          ? {
              reason:
                "the space declares a supply flow of 0 m3/s, so an occupied space reaches no steady-state concentration at all",
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
    keys: metrics.map((entry) => entry.key),
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
      targets: request.targets.map((target) => ({
        key: target.key,
        unit: target.unit,
        value: target.value,
        comparison: target.comparison,
      })),
    }),
    outcome: { status: "solved", metrics, samples: [], warnings },
  });
};
