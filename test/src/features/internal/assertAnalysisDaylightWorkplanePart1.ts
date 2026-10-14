import {
  type IAutoMovieAnalysisWorkplane,
  type IAutoMovieDaylightRequest,
  analyzeAutoMovieDaylight,
} from "@automovie/engine";
import type {
  AutoMovieAnalysisDomain,
  IAutoMovieAnalysisMetric,
  IAutoMovieAnalysisRun,
  IAutoMovieAnalysisSample,
  IAutoMovieEnvironmentContext,
  IAutoMovieHalfSpacePlane,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { analysisContext, boxSolid } from "./analysisFixtures";
import { nclose } from "./predicates";

/** Execute the next ordered assertions of test_analysis_daylight_workplane.
 *
 * Scenarios:
 * 1. noon on an unobstructed horizontal plane is the whole beam plus the whole vault.
 * 2. a sun at 45 degrees delivers exactly its own cosine of the declared beam.
 * 3. a dark instant leaves the plane at zero, with every ratio it makes undefined.
 * 4. a canopy removes the vault, and a downward plane never had one.
 * 5. a read-only neighbouring mass shades the plane exactly as a building shade does.
 * 6. a vertical plane sees the analytic half of the isotropic vault.
 * 7. a vertical plane receives no beam from a sun directly overhead.
 *
 * Cosine projection gives 1000+200lx at noon and 800/sqrt(2)lx for the oblique beam; a vertical plane receives half an isotropic vault within the stated sampling tolerance. Authored box half-spaces independently determine complete occlusion. These are simplified model expectations, not measured daylight certification.
 * Noon/afternoon/night, overhead shade/neighbour, downward/vertical workplanes and zero beam distinguish cosine, visibility and undefined ratios. Later parts own luminaires, target warnings and request refusals.
 */
export function assertAnalysisDaylightWorkplanePart1(): {
  upward: IAutoMovieAnalysisWorkplane;
  study: (
    overrides?: Partial<IAutoMovieDaylightRequest>,
  ) => IAutoMovieAnalysisRun;
  metrics: (run: IAutoMovieAnalysisRun) => IAutoMovieAnalysisMetric[];
  of: (run: IAutoMovieAnalysisRun, key: string) => number | null;
  statusOf: (run: IAutoMovieAnalysisRun, key: string) => string;
  noon: IAutoMovieAnalysisRun;
  afternoon: IAutoMovieAnalysisRun;
  shaded: IAutoMovieAnalysisRun;
} {
  const context: IAutoMovieEnvironmentContext = analysisContext();
  const upward: IAutoMovieAnalysisWorkplane = {
    origin: { x: -1, y: 0, z: 1 },
    axisU: { x: 1, y: 0, z: 0 },
    axisV: { x: 0, y: 0, z: -1 },
    sizeU: 2,
    sizeV: 2,
    countU: 1,
    countV: 1,
  };
  const request: (
    overrides?: Partial<IAutoMovieDaylightRequest>,
  ) => IAutoMovieDaylightRequest = (
    overrides: Partial<IAutoMovieDaylightRequest> = {},
  ): IAutoMovieDaylightRequest => ({
    id: "hall-daylight",
    subject: "space:hall",
    inputRevision: "r7",
    context,
    instant: "noon",
    workplane: upward,
    shades: [],
    luminaires: [],
    sky: "isotropic",
    diffuseSamples: 64,
    targets: [],
    ...overrides,
  });
  const study: (
    overrides?: Partial<IAutoMovieDaylightRequest>,
  ) => IAutoMovieAnalysisRun = (
    overrides: Partial<IAutoMovieDaylightRequest> = {},
  ): IAutoMovieAnalysisRun =>
    analyzeAutoMovieDaylight({ request: request(overrides) });
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

  const noon: IAutoMovieAnalysisRun = study();
  TestValidator.predicate(
    "noon on an unobstructed horizontal plane is the whole beam plus the whole vault",
    ((): boolean => {
      const observed: {
        domain: AutoMovieAnalysisDomain;
        status: "solved" | "unsupported" | "not-run";
        direct: number | null;
        sky: number | null;
        daylight: number | null;
        artificial: number | null;
        total: number | null;
        min: number | null;
        max: number | null;
        uniformity: number | null;
        contrast: number | null;
        daylightFactor: number | null;
        groundReflected: number | null;
        groundStatus: string;
        samples: (string | number | IAutoMovieVector3)[][];
      } = {
        domain: noon.domain,
        status: noon.outcome.status,
        direct: of(noon, "workplane.direct.illuminance"),
        sky: of(noon, "workplane.skyDiffuse.illuminance"),
        daylight: of(noon, "workplane.daylight.illuminance"),
        artificial: of(noon, "workplane.artificial.illuminance"),
        total: of(noon, "workplane.total.illuminance"),
        min: of(noon, "workplane.total.illuminance.min"),
        max: of(noon, "workplane.total.illuminance.max"),
        uniformity: of(noon, "workplane.total.uniformity"),
        contrast: of(noon, "workplane.total.contrast"),
        daylightFactor: of(noon, "workplane.daylightFactor"),
        groundReflected: of(noon, "workplane.groundReflected.illuminance"),
        groundStatus: statusOf(noon, "workplane.groundReflected.illuminance"),
        samples:
          noon.outcome.status === "solved"
            ? noon.outcome.samples.map(
                (
                  sample: IAutoMovieAnalysisSample,
                ): (string | number | IAutoMovieVector3)[] => [
                  sample.id,
                  sample.key,
                  sample.position,
                  sample.value,
                ],
              )
            : [],
      };
      return (
        typeof observed === "object" &&
        observed !== null &&
        observed !== undefined &&
        Object.keys(observed).length === 15 &&
        Object.hasOwn(observed, "domain") &&
        observed["domain"] === "daylight" &&
        Object.hasOwn(observed, "status") &&
        observed["status"] === "solved" &&
        Object.hasOwn(observed, "direct") &&
        typeof observed["direct"] === "number" &&
        nclose(observed["direct"], 1000) &&
        Object.hasOwn(observed, "sky") &&
        typeof observed["sky"] === "number" &&
        nclose(observed["sky"], 200) &&
        Object.hasOwn(observed, "daylight") &&
        typeof observed["daylight"] === "number" &&
        nclose(observed["daylight"], 1200) &&
        Object.hasOwn(observed, "artificial") &&
        typeof observed["artificial"] === "number" &&
        nclose(observed["artificial"], 0) &&
        Object.hasOwn(observed, "total") &&
        typeof observed["total"] === "number" &&
        nclose(observed["total"], 1200) &&
        Object.hasOwn(observed, "min") &&
        typeof observed["min"] === "number" &&
        nclose(observed["min"], 1200) &&
        Object.hasOwn(observed, "max") &&
        typeof observed["max"] === "number" &&
        nclose(observed["max"], 1200) &&
        Object.hasOwn(observed, "uniformity") &&
        typeof observed["uniformity"] === "number" &&
        nclose(observed["uniformity"], 1) &&
        Object.hasOwn(observed, "contrast") &&
        typeof observed["contrast"] === "number" &&
        nclose(observed["contrast"], 1) &&
        Object.hasOwn(observed, "daylightFactor") &&
        typeof observed["daylightFactor"] === "number" &&
        nclose(observed["daylightFactor"], 100) &&
        Object.hasOwn(observed, "groundReflected") &&
        observed["groundReflected"] === null &&
        Object.hasOwn(observed, "groundStatus") &&
        observed["groundStatus"] === "unsupported" &&
        Object.hasOwn(observed, "samples") &&
        Array.isArray(observed["samples"]) &&
        observed["samples"].length === 1 &&
        Array.isArray(observed["samples"][0]!) &&
        observed["samples"][0]!.length === 4 &&
        observed["samples"][0]![0] === "0-0" &&
        observed["samples"][0]![1] === "workplane.total.illuminance" &&
        typeof observed["samples"][0]![2]! === "object" &&
        observed["samples"][0]![2] !== null &&
        observed["samples"][0]![2] !== undefined &&
        Object.keys(observed["samples"][0]![2]!).length === 3 &&
        Object.hasOwn(observed["samples"][0]![2]!, "x") &&
        typeof observed["samples"][0]![2]!["x"] === "number" &&
        nclose(observed["samples"][0]![2]!["x"], 0) &&
        Object.hasOwn(observed["samples"][0]![2]!, "y") &&
        typeof observed["samples"][0]![2]!["y"] === "number" &&
        nclose(observed["samples"][0]![2]!["y"], 0) &&
        Object.hasOwn(observed["samples"][0]![2]!, "z") &&
        typeof observed["samples"][0]![2]!["z"] === "number" &&
        nclose(observed["samples"][0]![2]!["z"], 0) &&
        typeof observed["samples"][0]![3]! === "number" &&
        nclose(observed["samples"][0]![3]!, 1200)
      );
    })(),
  );

  const afternoon: IAutoMovieAnalysisRun = study({ instant: "afternoon" });
  const night: IAutoMovieAnalysisRun = study({ instant: "night" });
  TestValidator.predicate(
    "a sun at 45 degrees delivers exactly its own cosine of the declared beam",
    nclose(
      of(afternoon, "workplane.direct.illuminance") ?? Number.NaN,
      800 * (1 / Math.sqrt(2)),
      1e-9,
    ),
  );
  TestValidator.predicate(
    "a dark instant leaves the plane at zero, with every ratio it makes undefined",
    ((): boolean => {
      const observed: {
        direct: number | null;
        sky: number | null;
        total: number | null;
        uniformity: string;
        contrast: string;
        daylightFactor: string;
        reasons: string[];
      } = {
        direct: of(night, "workplane.direct.illuminance"),
        sky: of(night, "workplane.skyDiffuse.illuminance"),
        total: of(night, "workplane.total.illuminance"),
        uniformity: statusOf(night, "workplane.total.uniformity"),
        contrast: statusOf(night, "workplane.total.contrast"),
        daylightFactor: statusOf(night, "workplane.daylightFactor"),
        reasons: metrics(night)
          .filter(
            (metric: IAutoMovieAnalysisMetric): boolean =>
              metric.gap !== null && metric.status === "not-run",
          )
          .map((metric: IAutoMovieAnalysisMetric): string => metric.key),
      };
      return (
        typeof observed === "object" &&
        observed !== null &&
        observed !== undefined &&
        Object.keys(observed).length === 7 &&
        Object.hasOwn(observed, "direct") &&
        typeof observed["direct"] === "number" &&
        nclose(observed["direct"], 0) &&
        Object.hasOwn(observed, "sky") &&
        typeof observed["sky"] === "number" &&
        nclose(observed["sky"], 0) &&
        Object.hasOwn(observed, "total") &&
        typeof observed["total"] === "number" &&
        nclose(observed["total"], 0) &&
        Object.hasOwn(observed, "uniformity") &&
        observed["uniformity"] === "not-run" &&
        Object.hasOwn(observed, "contrast") &&
        observed["contrast"] === "not-run" &&
        Object.hasOwn(observed, "daylightFactor") &&
        observed["daylightFactor"] === "not-run" &&
        Object.hasOwn(observed, "reasons") &&
        Array.isArray(observed["reasons"]) &&
        observed["reasons"].length === 3 &&
        observed["reasons"][0] === "workplane.total.uniformity" &&
        observed["reasons"][1] === "workplane.total.contrast" &&
        observed["reasons"][2] === "workplane.daylightFactor"
      );
    })(),
  );

  const canopy: { id: string; planes: IAutoMovieHalfSpacePlane[] } = boxSolid(
    "canopy",
    { x: -1000, y: 2, z: -1000 },
    { x: 1000, y: 4, z: 1000 },
  );
  const shaded: IAutoMovieAnalysisRun = study({ shades: [canopy] });
  const downward: IAutoMovieAnalysisRun = study({
    workplane: { ...upward, axisV: { x: 0, y: 0, z: 1 } },
  });
  TestValidator.predicate(
    "a canopy removes the vault, and a downward plane never had one",
    ((): boolean => {
      const observed: {
        shadedDirect: number | null;
        shadedSky: number | null;
        shadedTotal: number | null;
        downwardDirect: number | null;
        downwardSky: number | null;
      } = {
        shadedDirect: of(shaded, "workplane.direct.illuminance"),
        shadedSky: of(shaded, "workplane.skyDiffuse.illuminance"),
        shadedTotal: of(shaded, "workplane.total.illuminance"),
        downwardDirect: of(downward, "workplane.direct.illuminance"),
        downwardSky: of(downward, "workplane.skyDiffuse.illuminance"),
      };
      return (
        typeof observed === "object" &&
        observed !== null &&
        observed !== undefined &&
        Object.keys(observed).length === 5 &&
        Object.hasOwn(observed, "shadedDirect") &&
        typeof observed["shadedDirect"] === "number" &&
        nclose(observed["shadedDirect"], 0) &&
        Object.hasOwn(observed, "shadedSky") &&
        typeof observed["shadedSky"] === "number" &&
        nclose(observed["shadedSky"], 0) &&
        Object.hasOwn(observed, "shadedTotal") &&
        typeof observed["shadedTotal"] === "number" &&
        nclose(observed["shadedTotal"], 0) &&
        Object.hasOwn(observed, "downwardDirect") &&
        typeof observed["downwardDirect"] === "number" &&
        nclose(observed["downwardDirect"], 0) &&
        Object.hasOwn(observed, "downwardSky") &&
        typeof observed["downwardSky"] === "number" &&
        nclose(observed["downwardSky"], 0)
      );
    })(),
  );

  const neighbourly: IAutoMovieAnalysisRun = study({
    context: analysisContext({
      occluders: [
        {
          ...boxSolid(
            "neighbour",
            { x: -1000, y: 2, z: -1000 },
            { x: 1000, y: 4, z: 1000 },
          ),
          kind: "neighbour-tower",
        },
      ],
    }),
  });
  TestValidator.predicate(
    "a read-only neighbouring mass shades the plane exactly as a building shade does",
    ((): boolean => {
      const observed: {
        direct: number | null;
        sky: number | null;
        distinct: boolean;
      } = {
        direct: of(neighbourly, "workplane.direct.illuminance"),
        sky: of(neighbourly, "workplane.skyDiffuse.illuminance"),
        distinct: neighbourly.digest !== shaded.digest,
      };
      return (
        typeof observed === "object" &&
        observed !== null &&
        observed !== undefined &&
        Object.keys(observed).length === 3 &&
        Object.hasOwn(observed, "direct") &&
        typeof observed["direct"] === "number" &&
        nclose(observed["direct"], 0) &&
        Object.hasOwn(observed, "sky") &&
        typeof observed["sky"] === "number" &&
        nclose(observed["sky"], 0) &&
        Object.hasOwn(observed, "distinct") &&
        observed["distinct"] === true
      );
    })(),
  );

  // A vertical plane sees the sky above the horizon and the ground below it, so
  // the isotropic vault contributes DHI * (1 + cos 90) / 2 = DHI / 2. The
  // estimator samples that half rather than integrating it, so the assertion is
  // the analytic value with a stated sampling bound rather than an equality.
  const vertical: IAutoMovieAnalysisRun = study({
    workplane: {
      origin: { x: -1, y: -1, z: 0 },
      axisU: { x: 0, y: 1, z: 0 },
      axisV: { x: 1, y: 0, z: 0 },
      sizeU: 2,
      sizeV: 2,
      countU: 1,
      countV: 1,
    },
    diffuseSamples: 256,
  });
  TestValidator.predicate(
    "a vertical plane sees the analytic half of the isotropic vault",
    nclose(
      of(vertical, "workplane.skyDiffuse.illuminance") ?? Number.NaN,
      100,
      10,
    ),
  );
  TestValidator.predicate(
    "a vertical plane receives no beam from a sun directly overhead",
    ((): boolean => {
      const observed: number | null = of(
        vertical,
        "workplane.direct.illuminance",
      );
      return typeof observed === "number" && nclose(observed, 0);
    })(),
  );
  return { upward, study, metrics, of, statusOf, noon, afternoon, shaded };
}
