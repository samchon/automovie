import type { AutoMovieAnalysisDomain, IAutoMovieAnalysisSample, IAutoMovieAnalysisMetric, IAutoMovieAnalysisRun, IAutoMovieAnalysisWarning } from "@automovie/interface";
import type { IAutoMovieAnalysisWorkplane } from "../../../../packages/engine/src/analysis/IAutoMovieAnalysisWorkplane";
import type { IAutoMovieDaylightRequest } from "../../../../packages/engine/src/analysis/IAutoMovieDaylightRequest";
import { TestValidator } from "@nestia/e2e";
import { boxSolid } from "./analysisFixtures";
import { nclose } from "./predicates";

/** Execute the next ordered assertions of test_analysis_daylight_workplane.
 *
 * Scenarios:
 * 1. an artificial-only study is the inverse square law and nothing else.
 * 2. a fitting behind the plane or lying on it contributes nothing.
 * 3. one shaded cell of two makes uniformity zero and contrast undefined.
 * 4. an unimplemented sky is unsupported and an unlit study is not-run.
 * 5. targets judge in their own unit, and an inapplicable one is stated rather than dropped.
 *
 * A 900cd point source at 3m gives 100lx by the inverse-square law; two cells with 100 and 0lx have mean 50lx, zero minimum uniformity and undefined max/min contrast. Declared units and metric-key membership determine target/warning expectations, not physical reflection or emitter calibration.
 * Artificial-only, behind/coincident/occluded fittings, unequal cells, unimplemented sky, no emitter, target success/failure and wrong-unit/unknown-key targets distinguish measurements from explicit gaps. Part1 owns daylight arithmetic and Part3 owns provenance/refusal metadata.
 */
export function assertAnalysisDaylightWorkplanePart2(upward: IAutoMovieAnalysisWorkplane, study: (overrides?: Partial<IAutoMovieDaylightRequest>) => IAutoMovieAnalysisRun, metrics: (run: IAutoMovieAnalysisRun) => IAutoMovieAnalysisMetric[], of: (run: IAutoMovieAnalysisRun, key: string) => number | null, statusOf: (run: IAutoMovieAnalysisRun, key: string) => string): void {

  const lamp: IAutoMovieAnalysisRun = study({
    instant: null,
    luminaires: [
      { id: "downlight", position: { x: 0, y: 3, z: 0 }, intensity: 900 },
    ],
  });
  TestValidator.predicate(
    "an artificial-only study is the inverse square law and nothing else",
    (() : boolean => {
      const observed: { domain: AutoMovieAnalysisDomain; artificial: number | null; total: number | null; uniformity: number | null; contrast: number | null; daylight: string[][]; } = {
      domain: lamp.domain,
      artificial: of(lamp, "workplane.artificial.illuminance"),
      total: of(lamp, "workplane.total.illuminance"),
      uniformity: of(lamp, "workplane.total.uniformity"),
      contrast: of(lamp, "workplane.total.contrast"),
      daylight: metrics(lamp)
        .filter(
          (metric: IAutoMovieAnalysisMetric): boolean =>
            metric.key.startsWith("workplane.direct") ||
            metric.key.startsWith("workplane.skyDiffuse") ||
            metric.key.startsWith("workplane.daylight"),
        )
        .map((metric: IAutoMovieAnalysisMetric): string[] => [metric.key, metric.status]),
    };
      return (
        typeof observed === "object" && observed !== null && observed !== undefined &&
        Object.keys(observed).length === 6 &&
        Object.hasOwn(observed, "domain") &&
        observed["domain"] === "artificial-light" &&
        Object.hasOwn(observed, "artificial") &&
        typeof observed["artificial"] === "number" && nclose(observed["artificial"], 100) &&
        Object.hasOwn(observed, "total") &&
        typeof observed["total"] === "number" && nclose(observed["total"], 100) &&
        Object.hasOwn(observed, "uniformity") &&
        typeof observed["uniformity"] === "number" && nclose(observed["uniformity"], 1) &&
        Object.hasOwn(observed, "contrast") &&
        typeof observed["contrast"] === "number" && nclose(observed["contrast"], 1) &&
        Object.hasOwn(observed, "daylight") &&
        Array.isArray(observed["daylight"]) && observed["daylight"].length === 4 &&
        Array.isArray(observed["daylight"][0]!) && observed["daylight"][0]!.length === 2 &&
        observed["daylight"][0]![0] === "workplane.direct.illuminance" &&
        observed["daylight"][0]![1] === "not-run" &&
        Array.isArray(observed["daylight"][1]!) && observed["daylight"][1]!.length === 2 &&
        observed["daylight"][1]![0] === "workplane.skyDiffuse.illuminance" &&
        observed["daylight"][1]![1] === "not-run" &&
        Array.isArray(observed["daylight"][2]!) && observed["daylight"][2]!.length === 2 &&
        observed["daylight"][2]![0] === "workplane.daylight.illuminance" &&
        observed["daylight"][2]![1] === "not-run" &&
        Array.isArray(observed["daylight"][3]!) && observed["daylight"][3]!.length === 2 &&
        observed["daylight"][3]![0] === "workplane.daylightFactor" &&
        observed["daylight"][3]![1] === "not-run"
      );
    })(),
  );

  const behind: IAutoMovieAnalysisRun = study({
    instant: null,
    luminaires: [
      { id: "uplight", position: { x: 0, y: -3, z: 0 }, intensity: 900 },
    ],
  });
  const onPlane: IAutoMovieAnalysisRun = study({
    instant: null,
    luminaires: [
      { id: "flush", position: { x: 0, y: 0, z: 0 }, intensity: 900 },
    ],
  });

  TestValidator.predicate(
    "a fitting behind the plane or lying on it contributes nothing",
    (() : boolean => {
      const observed: { behind: number | null; behindWarnings: IAutoMovieAnalysisWarning[]; flush: number | null; flushWarnings: (string | null)[][]; } = {
      behind: of(behind, "workplane.artificial.illuminance"),
      behindWarnings:
        behind.outcome.status === "solved" ? behind.outcome.warnings : [],
      flush: of(onPlane, "workplane.artificial.illuminance"),
      flushWarnings:
        onPlane.outcome.status === "solved"
          ? onPlane.outcome.warnings.map((warning: IAutoMovieAnalysisWarning): (string | null)[] => [
              warning.code,
              warning.subject,
            ])
          : [],
    };
      return (
        typeof observed === "object" && observed !== null && observed !== undefined &&
        Object.keys(observed).length === 4 &&
        Object.hasOwn(observed, "behind") &&
        typeof observed["behind"] === "number" && nclose(observed["behind"], 0) &&
        Object.hasOwn(observed, "behindWarnings") &&
        Array.isArray(observed["behindWarnings"]) && observed["behindWarnings"].length === 0 &&
        Object.hasOwn(observed, "flush") &&
        typeof observed["flush"] === "number" && nclose(observed["flush"], 0) &&
        Object.hasOwn(observed, "flushWarnings") &&
        Array.isArray(observed["flushWarnings"]) && observed["flushWarnings"].length === 1 &&
        Array.isArray(observed["flushWarnings"][0]!) && observed["flushWarnings"][0]!.length === 2 &&
        observed["flushWarnings"][0]![0] === "luminaire-on-workplane" &&
        observed["flushWarnings"][0]![1] === "flush"
      );
    })(),
  );

  // Two cells at (-0.5, 0, 0) and (0.5, 0, 0). The fitting stands over the
  // first; a block from x = 0 to x = 2 between y = 1 and y = 2 stands across the
  // sight line to the second and clears the first entirely.
  const split: IAutoMovieAnalysisRun = study({
    instant: null,
    workplane: { ...upward, countU: 2 },
    luminaires: [
      { id: "downlight", position: { x: -0.5, y: 3, z: 0 }, intensity: 900 },
    ],
    shades: [boxSolid("beam", { x: 0, y: 1, z: -1 }, { x: 2, y: 2, z: 1 })],
  });
  TestValidator.predicate(
    "one shaded cell of two makes uniformity zero and contrast undefined",
    (() : boolean => {
      const observed: { samples: (string | number)[][]; mean: number | null; min: number | null; max: number | null; uniformity: number | null; contrast: string; } = {
      samples:
        split.outcome.status === "solved"
          ? split.outcome.samples.map((sample: IAutoMovieAnalysisSample): (string | number)[] => [
              sample.id,
              sample.position.x,
              sample.value,
            ])
          : [],
      mean: of(split, "workplane.total.illuminance"),
      min: of(split, "workplane.total.illuminance.min"),
      max: of(split, "workplane.total.illuminance.max"),
      uniformity: of(split, "workplane.total.uniformity"),
      contrast: statusOf(split, "workplane.total.contrast"),
    };
      return (
        typeof observed === "object" && observed !== null && observed !== undefined &&
        Object.keys(observed).length === 6 &&
        Object.hasOwn(observed, "samples") &&
        Array.isArray(observed["samples"]) && observed["samples"].length === 2 &&
        Array.isArray(observed["samples"][0]!) && observed["samples"][0]!.length === 3 &&
        observed["samples"][0]![0] === "0-0" &&
        typeof observed["samples"][0]![1]! === "number" && nclose(observed["samples"][0]![1]!, -0.5) &&
        typeof observed["samples"][0]![2]! === "number" && nclose(observed["samples"][0]![2]!, 100) &&
        Array.isArray(observed["samples"][1]!) && observed["samples"][1]!.length === 3 &&
        observed["samples"][1]![0] === "1-0" &&
        typeof observed["samples"][1]![1]! === "number" && nclose(observed["samples"][1]![1]!, 0.5) &&
        typeof observed["samples"][1]![2]! === "number" && nclose(observed["samples"][1]![2]!, 0) &&
        Object.hasOwn(observed, "mean") &&
        typeof observed["mean"] === "number" && nclose(observed["mean"], 50) &&
        Object.hasOwn(observed, "min") &&
        typeof observed["min"] === "number" && nclose(observed["min"], 0) &&
        Object.hasOwn(observed, "max") &&
        typeof observed["max"] === "number" && nclose(observed["max"], 100) &&
        Object.hasOwn(observed, "uniformity") &&
        typeof observed["uniformity"] === "number" && nclose(observed["uniformity"], 0) &&
        Object.hasOwn(observed, "contrast") &&
        observed["contrast"] === "not-run"
      );
    })(),
  );

  const perez: IAutoMovieAnalysisRun = study({ sky: "perez-all-weather" });
  const dark: IAutoMovieAnalysisRun = study({ instant: null });
  TestValidator.equals("an unimplemented sky is unsupported and an unlit study is not-run", {
      perez:
        perez.outcome.status === "unsupported"
          ? [
              perez.outcome.status,
              perez.outcome.reason.includes("perez-all-weather"),
              perez.outcome.remedy.includes("isotropic"),
            ]
          : [perez.outcome.status],
      dark:
        dark.outcome.status === "not-run"
          ? [
              dark.outcome.status,
              dark.outcome.reason.includes("nothing emits light"),
              dark.outcome.remedy.includes("declare at least one luminaire"),
            ]
          : [dark.outcome.status],
    }, {
      perez: ["unsupported", true, true],
      dark: ["not-run", true, true],
    });

  const judged: IAutoMovieAnalysisRun = study({
    targets: [
      {
        key: "workplane.total.illuminance",
        unit: "lx",
        value: 300,
        comparison: "at-least",
      },
      {
        key: "workplane.total.uniformity",
        unit: "ratio",
        value: 0.6,
        comparison: "at-least",
      },
    ],
  });
  const missed: IAutoMovieAnalysisRun = study({
    targets: [
      {
        key: "workplane.total.illuminance",
        unit: "lx",
        value: 5000,
        comparison: "at-least",
      },
    ],
  });
  const mismatched: IAutoMovieAnalysisRun = study({
    targets: [
      {
        key: "workplane.total.illuminance",
        unit: "cd",
        value: 300,
        comparison: "at-least",
      },
    ],
  });
  const hopeful: IAutoMovieAnalysisRun = study({
    targets: [
      {
        key: "workplane.glareIndex",
        unit: "ratio",
        value: 19,
        comparison: "at-most",
      },
    ],
  });
  TestValidator.equals("targets judge in their own unit, and an inapplicable one is stated rather than dropped", {
      met: statusOf(judged, "workplane.total.illuminance"),
      uniformity: statusOf(judged, "workplane.total.uniformity"),
      missed: statusOf(missed, "workplane.total.illuminance"),
      mismatched: statusOf(mismatched, "workplane.total.illuminance"),
      warning:
        mismatched.outcome.status === "solved"
          ? mismatched.outcome.warnings.map((warning: IAutoMovieAnalysisWarning): string => warning.code)
          : [],
      // A study that judges nothing at all still says so: the whole point is
      // that a report cannot read `meets` over a rule nobody could apply.
      unknownKey:
        hopeful.outcome.status === "solved"
          ? hopeful.outcome.warnings.map((warning: IAutoMovieAnalysisWarning): (string | null)[] => [
              warning.code,
              warning.subject,
            ])
          : [],
      // The negative twin: every target of the judged study names a metric it
      // reports, so nothing is warned about there.
      judgedWarnings:
        judged.outcome.status === "solved" ? judged.outcome.warnings : [],
    }, {
      met: "meets",
      uniformity: "meets",
      missed: "misses",
      mismatched: "untargeted",
      warning: ["target-unit-mismatch"],
      unknownKey: [["target-key-unknown", "workplane.glareIndex"]],
      judgedWarnings: [],
    });
}
