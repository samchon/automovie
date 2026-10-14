import {
  type IAutoMovieEnvelopeRequest,
  type IAutoMovieSpaceAirRequest,
  analyzeAutoMovieSpaceAir,
} from "@automovie/engine";
import type {
  AutoMovieAnalysisDomain,
  IAutoMovieAnalysisMetric,
  IAutoMovieAnalysisRun,
  IAutoMovieAnalysisSample,
  IAutoMovieAnalysisWarning,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "./predicates";

/** Execute the next ordered assertions of test_analysis_envelope_hygrothermal.
 *
 * Scenarios:
 * 1. air with no humidity has no dew point, so every moisture metric gaps.
 * 2. a missing exterior boundary condition is not-run, never assumed.
 * 3. ventilation answers the zone balance and refuses to answer the flow field.
 * 4. a space that declares no flow or nobody in it gaps rather than divides.
 * 5. declared targets judge the envelope and the ventilation in their own units.
 * 6. a target no run of the study reports is stated on every run of it.
 *
 * A 100m3 zone with 0.05m3/s flow and four occupants gives 1.8 air changes/hour and 12.5L/s/person; the authored per-person CO2 generation and outdoor concentration determine the well-mixed balance. Zero humidity has no logarithmic dew point, and absent boundary conditions supply no temperature premise. No local CFD or hygrothermal dynamics are established.
 * Zero/missing humidity and missing outdoor temperature contrast with finite conditions. Flow/no flow, occupants/no occupants, accumulation/undefined steady state and unsupported flow fields keep gaps visible; both target directions, wrong units and unknown keys are checked across the study's runs.
 */
export function assertAnalysisEnvelopeHygrothermalPart2(
  study: (overrides?: Partial<IAutoMovieEnvelopeRequest>) => {
    thermal: IAutoMovieAnalysisRun;
    moisture: IAutoMovieAnalysisRun;
  },
  metrics: (run: IAutoMovieAnalysisRun) => IAutoMovieAnalysisMetric[],
  of: (run: IAutoMovieAnalysisRun, key: string) => number | null,
  statusOf: (run: IAutoMovieAnalysisRun, key: string) => string,
  bone: { thermal: IAutoMovieAnalysisRun; moisture: IAutoMovieAnalysisRun },
): {
  air: (
    overrides?: Partial<IAutoMovieSpaceAirRequest>,
  ) => IAutoMovieAnalysisRun;
} {
  TestValidator.equals(
    "air with no humidity has no dew point, so every moisture metric gaps",
    {
      statuses: metrics(bone.moisture).map(
        (metric: IAutoMovieAnalysisMetric): string[] => [
          metric.key,
          metric.status,
        ],
      ),
      samples:
        bone.moisture.outcome.status === "solved"
          ? bone.moisture.outcome.samples
          : null,
      thermalStillSolved: bone.thermal.outcome.status,
    },
    {
      statuses: [
        ["space.dewPoint", "not-run"],
        ["envelope.condensationMargin", "not-run"],
        ["envelope.condensationMargin.min", "not-run"],
        ["envelope.condensationRisk", "not-run"],
        ["envelope.interstitialCondensation", "unsupported"],
      ],
      samples: [],
      thermalStillSolved: "solved",
    },
  );

  const unbounded: {
    thermal: IAutoMovieAnalysisRun;
    moisture: IAutoMovieAnalysisRun;
  } = study({ instant: null });
  const dark: {
    thermal: IAutoMovieAnalysisRun;
    moisture: IAutoMovieAnalysisRun;
  } = study({ instant: "night" });
  TestValidator.equals(
    "a missing exterior boundary condition is not-run, never assumed",
    {
      noInstant: [
        unbounded.thermal.outcome.status,
        unbounded.moisture.outcome.status,
        unbounded.thermal.outcome.status === "not-run"
          ? unbounded.thermal.outcome.reason.includes(
              "no environmental instant",
            )
          : false,
      ],
      noTemperature: [
        dark.thermal.outcome.status,
        dark.moisture.outcome.status,
        dark.thermal.outcome.status === "not-run"
          ? dark.thermal.outcome.reason.includes(
              'instant "night" declares no outdoor air temperature',
            )
          : false,
      ],
    },
    {
      noInstant: ["not-run", "not-run", true],
      noTemperature: ["not-run", "not-run", true],
    },
  );

  const airRequest: (
    overrides?: Partial<IAutoMovieSpaceAirRequest>,
  ) => IAutoMovieSpaceAirRequest = (
    overrides: Partial<IAutoMovieSpaceAirRequest> = {},
  ): IAutoMovieSpaceAirRequest => ({
    id: "hall-air",
    subject: "space:hall",
    inputRevision: "r7",
    volume: 100,
    supplyFlow: 0.05,
    occupants: 4,
    occupantCarbonDioxide: 5e-6,
    outdoorCarbonDioxide: 400,
    targets: [],
    ...overrides,
  });

  const air: (
    overrides?: Partial<IAutoMovieSpaceAirRequest>,
  ) => IAutoMovieAnalysisRun = (
    overrides: Partial<IAutoMovieSpaceAirRequest> = {},
  ): IAutoMovieAnalysisRun =>
    analyzeAutoMovieSpaceAir({ request: airRequest(overrides) });
  const ventilated: IAutoMovieAnalysisRun = air();
  TestValidator.predicate(
    "ventilation answers the zone balance and refuses to answer the flow field",
    ((): boolean => {
      const observed: {
        domain: AutoMovieAnalysisDomain;
        changes: number | null;
        perPerson: number | null;
        steadyState: number | null;
        velocity: string;
        stagnation: string;
        samples: IAutoMovieAnalysisSample[] | null;
        stagnationReason: boolean;
      } = {
        domain: ventilated.domain,
        changes: of(ventilated, "space.airChangeRate"),
        perPerson: of(ventilated, "space.freshAirPerOccupant"),
        steadyState: of(ventilated, "space.carbonDioxide.steadyState"),
        velocity: statusOf(ventilated, "space.airVelocity.mean"),
        stagnation: statusOf(ventilated, "space.stagnationVolumeFraction"),
        samples:
          ventilated.outcome.status === "solved"
            ? ventilated.outcome.samples
            : null,
        stagnationReason:
          ventilated.outcome.status === "solved"
            ? (
                ventilated.outcome.metrics.find(
                  (metric: IAutoMovieAnalysisMetric): boolean =>
                    metric.key === "space.stagnationVolumeFraction",
                )?.gap?.reason ?? ""
              ).includes("computes none")
            : false,
      };
      return (
        typeof observed === "object" &&
        observed !== null &&
        observed !== undefined &&
        Object.keys(observed).length === 8 &&
        Object.hasOwn(observed, "domain") &&
        observed["domain"] === "air" &&
        Object.hasOwn(observed, "changes") &&
        typeof observed["changes"] === "number" &&
        nclose(observed["changes"], 1.8) &&
        Object.hasOwn(observed, "perPerson") &&
        typeof observed["perPerson"] === "number" &&
        nclose(observed["perPerson"], 12.5) &&
        Object.hasOwn(observed, "steadyState") &&
        typeof observed["steadyState"] === "number" &&
        nclose(observed["steadyState"], 800) &&
        Object.hasOwn(observed, "velocity") &&
        observed["velocity"] === "unsupported" &&
        Object.hasOwn(observed, "stagnation") &&
        observed["stagnation"] === "unsupported" &&
        Object.hasOwn(observed, "samples") &&
        Array.isArray(observed["samples"]) &&
        observed["samples"].length === 0 &&
        Object.hasOwn(observed, "stagnationReason") &&
        observed["stagnationReason"] === true
      );
    })(),
  );
  TestValidator.predicate(
    "a space that declares no flow or nobody in it gaps rather than divides",
    ((): boolean => {
      const observed: {
        noFlow: string[];
        noOccupants: (string | number | null)[];
        sealed: (string | number | null)[];
        sealedReasons: string[];
      } = {
        noFlow: [
          statusOf(air({ supplyFlow: null }), "space.airChangeRate"),
          statusOf(air({ supplyFlow: null }), "space.freshAirPerOccupant"),
          statusOf(
            air({ supplyFlow: null }),
            "space.carbonDioxide.steadyState",
          ),
        ],
        noOccupants: [
          of(air({ occupants: 0 }), "space.airChangeRate"),
          statusOf(air({ occupants: 0 }), "space.freshAirPerOccupant"),
          of(air({ occupants: 0 }), "space.carbonDioxide.steadyState"),
        ],
        sealed: [
          of(air({ supplyFlow: 0 }), "space.airChangeRate"),
          statusOf(air({ supplyFlow: 0 }), "space.carbonDioxide.steadyState"),
        ],
        sealedReasons: [
          air({ supplyFlow: 0 }),
          air({ supplyFlow: 0, occupants: 0 }),
          air({ supplyFlow: 0, occupantCarbonDioxide: 0 }),
        ]
          .map((run: IAutoMovieAnalysisRun): string =>
            run.outcome.status === "solved"
              ? (run.outcome.metrics.find(
                  (metric: IAutoMovieAnalysisMetric): boolean =>
                    metric.key === "space.carbonDioxide.steadyState",
                )?.gap?.reason ?? "")
              : "",
          )
          .map((reason: string): string =>
            reason.includes("rises without bound")
              ? "accumulates"
              : reason.includes("stays wherever it starts")
                ? "undetermined"
                : reason,
          ),
      };
      return (
        typeof observed === "object" &&
        observed !== null &&
        observed !== undefined &&
        Object.keys(observed).length === 4 &&
        Object.hasOwn(observed, "noFlow") &&
        Array.isArray(observed["noFlow"]) &&
        observed["noFlow"].length === 3 &&
        observed["noFlow"][0] === "not-run" &&
        observed["noFlow"][1] === "not-run" &&
        observed["noFlow"][2] === "not-run" &&
        Object.hasOwn(observed, "noOccupants") &&
        Array.isArray(observed["noOccupants"]) &&
        observed["noOccupants"].length === 3 &&
        typeof observed["noOccupants"][0]! === "number" &&
        nclose(observed["noOccupants"][0]!, 1.8) &&
        observed["noOccupants"][1] === "not-run" &&
        typeof observed["noOccupants"][2]! === "number" &&
        nclose(observed["noOccupants"][2]!, 400) &&
        Object.hasOwn(observed, "sealed") &&
        Array.isArray(observed["sealed"]) &&
        observed["sealed"].length === 2 &&
        typeof observed["sealed"][0]! === "number" &&
        nclose(observed["sealed"][0]!, 0) &&
        observed["sealed"][1] === "not-run" &&
        Object.hasOwn(observed, "sealedReasons") &&
        Array.isArray(observed["sealedReasons"]) &&
        observed["sealedReasons"].length === 3 &&
        observed["sealedReasons"][0] === "accumulates" &&
        observed["sealedReasons"][1] === "undetermined" &&
        observed["sealedReasons"][2] === "undetermined"
      );
    })(),
  );

  TestValidator.equals(
    "declared targets judge the envelope and the ventilation in their own units",
    {
      envelope: statusOf(
        study({
          targets: [
            {
              key: "envelope.heatLoss",
              unit: "W",
              value: 500,
              comparison: "at-most",
            },
          ],
        }).thermal,
        "envelope.heatLoss",
      ),
      ventilation: statusOf(
        air({
          targets: [
            {
              key: "space.airChangeRate",
              unit: "1/h",
              value: 2,
              comparison: "at-least",
            },
          ],
        }),
        "space.airChangeRate",
      ),
    },
    { envelope: "meets", ventilation: "misses" },
  );

  const warningsOf: (
    run: IAutoMovieAnalysisRun,
  ) => [string, string | null][] = (
    run: IAutoMovieAnalysisRun,
  ): [string, string | null][] =>
    run.outcome.status === "solved"
      ? run.outcome.warnings.map(
          (warning: IAutoMovieAnalysisWarning): [string, string | null] => [
            warning.code,
            warning.subject,
          ],
        )
      : [];
  // Heat and moisture are two runs of one study, so a dew-point target must not
  // read as unmatched merely because the thermal run has no such metric. A key
  // neither run reports is unmatched on both.
  const crossDomain: {
    thermal: IAutoMovieAnalysisRun;
    moisture: IAutoMovieAnalysisRun;
  } = study({
    targets: [
      {
        key: "space.dewPoint",
        unit: "degC",
        value: 12,
        comparison: "at-most",
      },
      {
        key: "envelope.airtightness",
        unit: "1/h",
        value: 3,
        comparison: "at-most",
      },
    ],
  });
  const ventilationKey: IAutoMovieAnalysisRun = air({
    targets: [
      {
        key: "space.draughtRating",
        unit: "ratio",
        value: 0.15,
        comparison: "at-most",
      },
    ],
  });
  TestValidator.equals(
    "a target no run of the study reports is stated on every run of it",
    {
      thermal: warningsOf(crossDomain.thermal),
      moisture: warningsOf(crossDomain.moisture),
      dewPointJudged: statusOf(crossDomain.moisture, "space.dewPoint"),
      ventilation: warningsOf(ventilationKey),
    },
    {
      thermal: [["target-key-unknown", "envelope.airtightness"]],
      moisture: [["target-key-unknown", "envelope.airtightness"]],
      dewPointJudged: "meets",
      ventilation: [["target-key-unknown", "space.draughtRating"]],
    },
  );
  return { air };
}
