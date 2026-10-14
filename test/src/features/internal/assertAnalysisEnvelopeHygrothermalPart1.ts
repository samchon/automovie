import type {
  AutoMovieAnalysisDomain,
  IAutoMovieAnalysisMetric,
  IAutoMovieAnalysisRun,
  IAutoMovieAnalysisSample,
  IAutoMovieAnalysisWarning,
  IAutoMovieEnvironmentContext,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { type IAutoMovieEnvelopeAssembly, type IAutoMovieEnvelopeRequest, analyzeAutoMovieEnvelope } from "@automovie/engine";


import { analysisContext } from "./analysisFixtures";
import { namedFacts, nclose } from "./predicates";

/** Execute the next ordered assertions of test_analysis_envelope_hygrothermal.
 *
 * Scenarios:
 * 1. the envelope reports the steady-state network exactly.
 * 2. the dew point is the Magnus value for the declared indoor air.
 * 3. condensation margins follow the dew point on every assembly.
 * 4. raising the indoor humidity puts exactly the coldest surface at risk.
 * 5. indoor air at the outdoor temperature has no heat flow to apportion.
 *
 * Authored layer resistances give R=1 and 0.8m2K/W, U=1 and 1.25W/(m2K), and 290W total heat including the 40W bridge. Surface temperatures and area-weighted means follow the declared series network. Dew point is independently inverted from NPL's published water Magnus relation; the fitted approximation and declared numeric tolerances limit physical accuracy.
 * Ordinary and higher indoor humidity distinguish safe/risky surface margins; equal indoor/outdoor temperature gives zero heat and an explicit temperature-factor gap. Other moisture absence, airflow and malformed requests belong to later parts.
 */
export function assertAnalysisEnvelopeHygrothermalPart1(): {
  wall: IAutoMovieEnvelopeAssembly;
  study: (overrides?: Partial<IAutoMovieEnvelopeRequest>) => {
    thermal: IAutoMovieAnalysisRun;
    moisture: IAutoMovieAnalysisRun;
  };
  metrics: (run: IAutoMovieAnalysisRun) => IAutoMovieAnalysisMetric[];
  of: (run: IAutoMovieAnalysisRun, key: string) => number | null;
  statusOf: (run: IAutoMovieAnalysisRun, key: string) => string;
  bone: { thermal: IAutoMovieAnalysisRun; moisture: IAutoMovieAnalysisRun };
} {
  const context: IAutoMovieEnvironmentContext = analysisContext();
  const wall: IAutoMovieEnvelopeAssembly = {
    id: "wall",
    boundary: "boundary:north",
    layers: [{ id: "core", thickness: 0.2, conductivity: 0.25 }],
    interiorFilm: 0.1,
    exteriorFilm: 0.1,
    area: 10,
    position: { x: 0, y: 1.5, z: 0 },
  };
  const glazing: IAutoMovieEnvelopeAssembly = {
    id: "glazing",
    boundary: "boundary:north",
    layers: [{ id: "pane", thickness: 0.006, conductivity: 0.01 }],
    interiorFilm: 0.1,
    exteriorFilm: 0.1,
    area: 2,
    position: { x: 2, y: 1.5, z: 0 },
  };
  const request: (
    overrides?: Partial<IAutoMovieEnvelopeRequest>,
  ) => IAutoMovieEnvelopeRequest = (
    overrides: Partial<IAutoMovieEnvelopeRequest> = {},
  ): IAutoMovieEnvelopeRequest => ({
    id: "hall-envelope",
    subject: "space:hall",
    inputRevision: "r7",
    context,
    instant: "noon",
    indoor: { airTemperature: 20, relativeHumidity: 0.5 },
    assemblies: [wall, glazing],
    bridges: [
      {
        id: "lintel",
        assembly: "glazing",
        linearTransmittance: 0.5,
        length: 4,
      },
    ],
    targets: [],
    ...overrides,
  });
  const study: (overrides?: Partial<IAutoMovieEnvelopeRequest>) => {
    thermal: IAutoMovieAnalysisRun;
    moisture: IAutoMovieAnalysisRun;
  } = (
    overrides: Partial<IAutoMovieEnvelopeRequest> = {},
  ): { thermal: IAutoMovieAnalysisRun; moisture: IAutoMovieAnalysisRun } =>
    analyzeAutoMovieEnvelope({ request: request(overrides) });
  const metrics: (run: IAutoMovieAnalysisRun) => IAutoMovieAnalysisMetric[] = (
    run: IAutoMovieAnalysisRun,
  ): IAutoMovieAnalysisMetric[] =>
    run.outcome.status === "solved" ? run.outcome.metrics : [];
  const of: (run: IAutoMovieAnalysisRun, key: string) => number | null = (
    run: IAutoMovieAnalysisRun,
    key: string,
  ): number | null =>
    metrics(run).find(
      (metric: IAutoMovieAnalysisMetric): boolean => metric.key === key,
    )?.value ?? null;
  const statusOf: (run: IAutoMovieAnalysisRun, key: string) => string = (
    run: IAutoMovieAnalysisRun,
    key: string,
  ): string =>
    metrics(run).find(
      (metric: IAutoMovieAnalysisMetric): boolean => metric.key === key,
    )?.status ?? "absent";

  const base: {
    thermal: IAutoMovieAnalysisRun;
    moisture: IAutoMovieAnalysisRun;
  } = study();
  TestValidator.predicate(
    "the envelope reports the steady-state network exactly",
    ((): boolean => {
      const observed: {
        ids: string[];
        domains: AutoMovieAnalysisDomain[];
        settings: boolean;
        areaWeighted: number | null;
        worst: number | null;
        heatLoss: number | null;
        bridgeShare: number | null;
        temperatureFactor: number | null;
        surfaceMean: number | null;
        surfaceMin: number | null;
        solarGain: string;
        interstitial: string;
        warnings: IAutoMovieAnalysisWarning[];
        field: (string | number)[][];
      } = {
        ids: [base.thermal.id, base.moisture.id],
        domains: [base.thermal.domain, base.moisture.domain],
        settings: base.thermal.settings === base.moisture.settings,
        areaWeighted: of(
          base.thermal,
          "envelope.thermalTransmittance.areaWeighted",
        ),
        worst: of(base.thermal, "envelope.thermalTransmittance.max"),
        heatLoss: of(base.thermal, "envelope.heatLoss"),
        bridgeShare: of(base.thermal, "envelope.thermalBridgeShare"),
        temperatureFactor: of(base.thermal, "envelope.temperatureFactor.min"),
        surfaceMean: of(base.thermal, "envelope.surfaceTemperature"),
        surfaceMin: of(base.thermal, "envelope.surfaceTemperature.min"),
        solarGain: statusOf(base.thermal, "envelope.solarHeatGain"),
        interstitial: statusOf(
          base.moisture,
          "envelope.interstitialCondensation",
        ),
        warnings:
          base.thermal.outcome.status === "solved"
            ? base.thermal.outcome.warnings
            : [],
        field:
          base.thermal.outcome.status === "solved"
            ? base.thermal.outcome.samples.map(
                (sample: IAutoMovieAnalysisSample): (string | number)[] => [
                  sample.id,
                  sample.key,
                  sample.value,
                ],
              )
            : [],
      };
      return (
        typeof observed === "object" &&
        observed !== null &&
        observed !== undefined &&
        Object.keys(observed).length === 14 &&
        Object.hasOwn(observed, "ids") &&
        Array.isArray(observed["ids"]) &&
        observed["ids"].length === 2 &&
        observed["ids"][0] === "hall-envelope.thermal" &&
        observed["ids"][1] === "hall-envelope.moisture" &&
        Object.hasOwn(observed, "domains") &&
        Array.isArray(observed["domains"]) &&
        observed["domains"].length === 2 &&
        observed["domains"][0] === "thermal" &&
        observed["domains"][1] === "moisture" &&
        Object.hasOwn(observed, "settings") &&
        observed["settings"] === true &&
        Object.hasOwn(observed, "areaWeighted") &&
        typeof observed["areaWeighted"] === "number" &&
        nclose(observed["areaWeighted"], 12.5 / 12) &&
        Object.hasOwn(observed, "worst") &&
        typeof observed["worst"] === "number" &&
        nclose(observed["worst"], 1.25) &&
        Object.hasOwn(observed, "heatLoss") &&
        typeof observed["heatLoss"] === "number" &&
        nclose(observed["heatLoss"], 290) &&
        Object.hasOwn(observed, "bridgeShare") &&
        typeof observed["bridgeShare"] === "number" &&
        nclose(observed["bridgeShare"], 40 / 290) &&
        Object.hasOwn(observed, "temperatureFactor") &&
        typeof observed["temperatureFactor"] === "number" &&
        nclose(observed["temperatureFactor"], 0.875) &&
        Object.hasOwn(observed, "surfaceMean") &&
        typeof observed["surfaceMean"] === "number" &&
        nclose(observed["surfaceMean"], 215 / 12) &&
        Object.hasOwn(observed, "surfaceMin") &&
        typeof observed["surfaceMin"] === "number" &&
        nclose(observed["surfaceMin"], 17.5) &&
        Object.hasOwn(observed, "solarGain") &&
        observed["solarGain"] === "unsupported" &&
        Object.hasOwn(observed, "interstitial") &&
        observed["interstitial"] === "unsupported" &&
        Object.hasOwn(observed, "warnings") &&
        Array.isArray(observed["warnings"]) &&
        observed["warnings"].length === 0 &&
        Object.hasOwn(observed, "field") &&
        Array.isArray(observed["field"]) &&
        observed["field"].length === 2 &&
        Array.isArray(observed["field"][0]!) &&
        observed["field"][0]!.length === 3 &&
        observed["field"][0]![0] === "wall" &&
        observed["field"][0]![1] === "envelope.surfaceTemperature" &&
        typeof observed["field"][0]![2]! === "number" &&
        nclose(observed["field"][0]![2]!, 18) &&
        Array.isArray(observed["field"][1]!) &&
        observed["field"][1]!.length === 3 &&
        observed["field"][1]![0] === "glazing" &&
        observed["field"][1]![1] === "envelope.surfaceTemperature" &&
        typeof observed["field"][1]![2]! === "number" &&
        nclose(observed["field"][1]![2]!, 17.5)
      );
    })(),
  );

  const dry: {
    thermal: IAutoMovieAnalysisRun;
    moisture: IAutoMovieAnalysisRun;
  } = study({ indoor: { airTemperature: 20, relativeHumidity: 0.88 } });
  TestValidator.equals(
    "the dew point is the Magnus value for the declared indoor air",
    namedFacts([
      [
        "base",
        (): boolean =>
          nclose(
            of(base.moisture, "space.dewPoint") ?? Number.NaN,
            9.2552,
            1e-3,
          ),
      ],
      [
        "humid",
        (): boolean =>
          nclose(
            of(dry.moisture, "space.dewPoint") ?? Number.NaN,
            17.9501,
            1e-3,
          ),
      ],
    ]),
    { base: true, humid: true },
  );
  TestValidator.equals(
    "condensation margins follow the dew point on every assembly",
    namedFacts([
      [
        "mean",
        (): boolean =>
          nclose(
            of(base.moisture, "envelope.condensationMargin") ?? Number.NaN,
            8.66149,
            1e-4,
          ),
      ],
      [
        "min",
        (): boolean =>
          nclose(
            of(base.moisture, "envelope.condensationMargin.min") ?? Number.NaN,
            // Invert NPL's Equation 2 with e(Td)=0.5*e(20); the 611.2 Pa factor cancels.
            // https://www.npl.co.uk/resources/q-a/dew-point-and-relative-humidity
            17.5 -
              (243.12 * (Math.log(0.5) + (17.62 * 20) / (243.12 + 20))) /
                (17.62 - (Math.log(0.5) + (17.62 * 20) / (243.12 + 20))),
            1e-9,
          ),
      ],
    ]),
    { mean: true, min: true },
  );
  TestValidator.predicate(
    "raising the indoor humidity puts exactly the coldest surface at risk",
    ((): boolean => {
      const observed: {
        safe: number | null;
        atRisk: number | null;
        wetSurface: string[];
      } = {
        safe: of(base.moisture, "envelope.condensationRisk"),
        atRisk: of(dry.moisture, "envelope.condensationRisk"),
        wetSurface:
          dry.moisture.outcome.status === "solved"
            ? dry.moisture.outcome.samples
                .filter(
                  (sample: IAutoMovieAnalysisSample): boolean =>
                    sample.value <= 0,
                )
                .map((sample: IAutoMovieAnalysisSample): string => sample.id)
            : [],
      };
      return (
        typeof observed === "object" &&
        observed !== null &&
        observed !== undefined &&
        Object.keys(observed).length === 3 &&
        Object.hasOwn(observed, "safe") &&
        typeof observed["safe"] === "number" &&
        nclose(observed["safe"], 0) &&
        Object.hasOwn(observed, "atRisk") &&
        typeof observed["atRisk"] === "number" &&
        nclose(observed["atRisk"], 1) &&
        Object.hasOwn(observed, "wetSurface") &&
        Array.isArray(observed["wetSurface"]) &&
        observed["wetSurface"].length === 1 &&
        observed["wetSurface"][0] === "glazing"
      );
    })(),
  );

  const isothermal: {
    thermal: IAutoMovieAnalysisRun;
    moisture: IAutoMovieAnalysisRun;
  } = study({
    instant: "afternoon",
    indoor: { airTemperature: 5, relativeHumidity: 0.5 },
  });
  TestValidator.predicate(
    "indoor air at the outdoor temperature has no heat flow to apportion",
    ((): boolean => {
      const observed: {
        heatLoss: number | null;
        share: string;
        warnings: string[];
        surface: number | null;
      } = {
        heatLoss: of(isothermal.thermal, "envelope.heatLoss"),
        share: statusOf(isothermal.thermal, "envelope.thermalBridgeShare"),
        warnings:
          isothermal.thermal.outcome.status === "solved"
            ? isothermal.thermal.outcome.warnings.map(
                (warning: IAutoMovieAnalysisWarning): string => warning.code,
              )
            : [],
        surface: of(isothermal.thermal, "envelope.surfaceTemperature"),
      };
      return (
        typeof observed === "object" &&
        observed !== null &&
        observed !== undefined &&
        Object.keys(observed).length === 4 &&
        Object.hasOwn(observed, "heatLoss") &&
        typeof observed["heatLoss"] === "number" &&
        nclose(observed["heatLoss"], 0) &&
        Object.hasOwn(observed, "share") &&
        observed["share"] === "not-run" &&
        Object.hasOwn(observed, "warnings") &&
        Array.isArray(observed["warnings"]) &&
        observed["warnings"].length === 1 &&
        observed["warnings"][0] === "reverse-heat-flow" &&
        Object.hasOwn(observed, "surface") &&
        typeof observed["surface"] === "number" &&
        nclose(observed["surface"], 5)
      );
    })(),
  );

  const bone: {
    thermal: IAutoMovieAnalysisRun;
    moisture: IAutoMovieAnalysisRun;
  } = study({ indoor: { airTemperature: 20, relativeHumidity: 0 } });
  return { wall, study, metrics, of, statusOf, bone };
}
