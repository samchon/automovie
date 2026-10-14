import { nclose } from "./nclose";
import { summarizeAutoMovieAnalysis } from "../../../../packages/engine/src/analysis/summarizeAutoMovieAnalysis";
import { type IAutoMovieAnalysisMetric, type IAutoMovieAnalysisRun, type IAutoMovieAnalysisReport, type IAutoMovieAnalysisDomainRollup, AutoMovieAnalysisDomain, type IAutoMovieAnalysisGap } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** Execute the next ordered assertions of test_analysis_run_contract.
 *
 * Scenarios:
 * 1. a report meets only when the required domain answered this revision.
 * 2. a missing, stale, refused or gapped answer is incomplete, and a miss outranks it.
 * 3. the report bounds its gap list and counts the rest.
 * 4. moving a separator between a gap's reason and remedy changes the report digest.
 *
 * Hand-counted submitted records and required domains determine rollup counts, stale/missing gaps and misses-over-incomplete precedence. A two-gap bound over five refused runs must retain skip-0/skip-1 and count three omitted gaps. Repeat and separator-relocation digest relations establish the examined deterministic distinctions, not collision freedom or omitted-gap-text coverage.
 * Clean required-domain answer contrasts with missing, stale, unsupported/not-run and gapped answers; a failed target outranks those gaps. Fixed six-domain order, required flags, bounded gap listing and changed reason/remedy field boundaries are checked; Part7 owns malformed report requests.
 */
export function assertAnalysisRunContractPart6(measured: (overrides?: Partial<IAutoMovieAnalysisMetric>) => IAutoMovieAnalysisMetric, absent: (overrides?: Partial<IAutoMovieAnalysisMetric>) => IAutoMovieAnalysisMetric, run: (id: string, overrides: Partial<Omit<IAutoMovieAnalysisRun, "digest">>) => IAutoMovieAnalysisRun, clean: IAutoMovieAnalysisRun, report: IAutoMovieAnalysisReport): void {
  TestValidator.predicate(
    "a report meets only when the required domain answered this revision",
    (() : boolean => {
      const observed: { status: "meets" | "misses" | "incomplete"; gaps: IAutoMovieAnalysisGap[]; omitted: number; acoustic: IAutoMovieAnalysisDomainRollup | undefined; domains: AutoMovieAnalysisDomain[]; required: number; stable: boolean; different: boolean; } = {
      status: report.status,
      gaps: report.gaps,
      omitted: report.omittedGaps,
      acoustic: report.domains.find((row: IAutoMovieAnalysisDomainRollup): boolean => row.domain === "acoustic"),
      domains: report.domains.map((row: IAutoMovieAnalysisDomainRollup): AutoMovieAnalysisDomain => row.domain),
      required: report.domains.filter((row: IAutoMovieAnalysisDomainRollup): boolean => row.required).length,
      stable:
        report.digest ===
        summarizeAutoMovieAnalysis({
          runs: [clean],
          revision: "r7",
          required: ["acoustic"],
        }).digest,
      different:
        report.digest !==
        summarizeAutoMovieAnalysis({
          runs: [clean],
          revision: "r7",
          required: ["acoustic", "thermal"],
        }).digest,
    };
      return (
        typeof observed === "object" && observed !== null && observed !== undefined &&
        Object.keys(observed).length === 8 &&
        Object.hasOwn(observed, "status") &&
        observed["status"] === "meets" &&
        Object.hasOwn(observed, "gaps") &&
        Array.isArray(observed["gaps"]) && observed["gaps"].length === 0 &&
        Object.hasOwn(observed, "omitted") &&
        typeof observed["omitted"] === "number" && Number.isInteger(observed["omitted"]) && nclose(observed["omitted"], 0, 0) &&
        Object.hasOwn(observed, "acoustic") &&
        typeof observed["acoustic"] === "object" && observed["acoustic"] !== null && observed["acoustic"] !== undefined &&
        Object.keys(observed["acoustic"]).length === 11 &&
        Object.hasOwn(observed["acoustic"], "domain") &&
        observed["acoustic"]["domain"] === "acoustic" &&
        Object.hasOwn(observed["acoustic"], "runs") &&
        typeof observed["acoustic"]["runs"] === "number" && Number.isInteger(observed["acoustic"]["runs"]) && nclose(observed["acoustic"]["runs"], 1, 0) &&
        Object.hasOwn(observed["acoustic"], "solved") &&
        typeof observed["acoustic"]["solved"] === "number" && Number.isInteger(observed["acoustic"]["solved"]) && nclose(observed["acoustic"]["solved"], 1, 0) &&
        Object.hasOwn(observed["acoustic"], "unsupported") &&
        typeof observed["acoustic"]["unsupported"] === "number" && Number.isInteger(observed["acoustic"]["unsupported"]) && nclose(observed["acoustic"]["unsupported"], 0, 0) &&
        Object.hasOwn(observed["acoustic"], "notRun") &&
        typeof observed["acoustic"]["notRun"] === "number" && Number.isInteger(observed["acoustic"]["notRun"]) && nclose(observed["acoustic"]["notRun"], 0, 0) &&
        Object.hasOwn(observed["acoustic"], "stale") &&
        typeof observed["acoustic"]["stale"] === "number" && Number.isInteger(observed["acoustic"]["stale"]) && nclose(observed["acoustic"]["stale"], 0, 0) &&
        Object.hasOwn(observed["acoustic"], "metrics") &&
        typeof observed["acoustic"]["metrics"] === "number" && Number.isInteger(observed["acoustic"]["metrics"]) && nclose(observed["acoustic"]["metrics"], 1, 0) &&
        Object.hasOwn(observed["acoustic"], "measured") &&
        typeof observed["acoustic"]["measured"] === "number" && Number.isInteger(observed["acoustic"]["measured"]) && nclose(observed["acoustic"]["measured"], 1, 0) &&
        Object.hasOwn(observed["acoustic"], "meets") &&
        typeof observed["acoustic"]["meets"] === "number" && nclose(observed["acoustic"]["meets"], 1) &&
        Object.hasOwn(observed["acoustic"], "misses") &&
        typeof observed["acoustic"]["misses"] === "number" && nclose(observed["acoustic"]["misses"], 0) &&
        Object.hasOwn(observed["acoustic"], "required") &&
        observed["acoustic"]["required"] === true &&
        Object.hasOwn(observed, "domains") &&
        Array.isArray(observed["domains"]) && observed["domains"].length === 6 &&
        observed["domains"][0] === "daylight" &&
        observed["domains"][1] === "artificial-light" &&
        observed["domains"][2] === "thermal" &&
        observed["domains"][3] === "moisture" &&
        observed["domains"][4] === "air" &&
        observed["domains"][5] === "acoustic" &&
        Object.hasOwn(observed, "required") &&
        typeof observed["required"] === "number" && Number.isInteger(observed["required"]) && nclose(observed["required"], 1, 0) &&
        Object.hasOwn(observed, "stable") &&
        observed["stable"] === true &&
        Object.hasOwn(observed, "different") &&
        observed["different"] === true
      );
    })(),
  );


  const missing: IAutoMovieAnalysisReport = summarizeAutoMovieAnalysis({
    runs: [clean],
    revision: "r7",
    required: ["acoustic", "air"],
  });
  const stale: IAutoMovieAnalysisReport = summarizeAutoMovieAnalysis({
    runs: [run("stale", { inputRevision: "r6" })],
    revision: "r7",
    required: ["acoustic"],
  });
  const refused: IAutoMovieAnalysisReport = summarizeAutoMovieAnalysis({
    runs: [
      run("unsupported", {
        outcome: {
          status: "unsupported",
          reason: "no adapter",
          remedy: "bind one",
        },
      }),
      run("skipped", {
        domain: "air",
        outcome: {
          status: "not-run",
          reason: "no flow declared",
          remedy: "declare the supply flow",
        },
      }),
    ],
    revision: "r7",
    required: ["acoustic", "air"],
  });
  const gapped: IAutoMovieAnalysisReport = summarizeAutoMovieAnalysis({
    runs: [
      run("gapped", {
        outcome: {
          status: "solved",
          metrics: [
            measured(),
            absent({ key: "room.speechTransmissionIndex" }),
            absent({ key: "room.impulseResponse", status: "unsupported" }),
          ],
          samples: [],
          warnings: [],
        },
      }),
    ],
    revision: "r7",
    required: ["acoustic"],
  });
  const failing: IAutoMovieAnalysisReport = summarizeAutoMovieAnalysis({
    runs: [
      run("failing", {
        outcome: {
          status: "solved",
          metrics: [
            measured({ status: "misses", target: 0.5, comparison: "at-most" }),
            absent({ key: "room.speechTransmissionIndex" }),
          ],
          samples: [],
          warnings: [],
        },
      }),
    ],
    revision: "r7",
    required: ["acoustic"],
  });
  TestValidator.predicate(
    "a missing, stale, refused or gapped answer is incomplete, and a miss outranks it",
    (() : boolean => {
      const observed: { missing: ((string | null)[][] | "meets" | "misses" | "incomplete")[]; stale: (number | boolean | "meets" | "misses" | "incomplete" | undefined)[]; refused: (number | "meets" | "misses" | "incomplete" | ("unsupported" | "not-run")[] | undefined)[]; gapped: (number | (string | null)[][] | "meets" | "misses" | "incomplete" | undefined)[]; failing: (number | "meets" | "misses" | "incomplete")[]; } = {
      missing: [
        missing.status,
        missing.gaps.map((entry: IAutoMovieAnalysisGap): (string | null)[] => [entry.domain, entry.run, entry.status]),
      ],
      stale: [
        stale.status,
        stale.domains.find((row: IAutoMovieAnalysisDomainRollup): boolean => row.domain === "acoustic")?.stale,
        stale.gaps[0]?.reason.includes("r6"),
      ],
      refused: [
        refused.status,
        refused.domains.find((row: IAutoMovieAnalysisDomainRollup): boolean => row.domain === "acoustic")?.unsupported,
        refused.domains.find((row: IAutoMovieAnalysisDomainRollup): boolean => row.domain === "air")?.notRun,
        refused.gaps.map((entry: IAutoMovieAnalysisGap): "unsupported" | "not-run" => entry.status),
      ],
      gapped: [
        gapped.status,
        gapped.gaps.map((entry: IAutoMovieAnalysisGap): (string | null)[] => [entry.metric, entry.status]),
        gapped.domains.find((row: IAutoMovieAnalysisDomainRollup): boolean => row.domain === "acoustic")?.measured,
      ],
      failing: [failing.status, failing.gaps.length],
    };
      return (
        typeof observed === "object" && observed !== null && observed !== undefined &&
        Object.keys(observed).length === 5 &&
        Object.hasOwn(observed, "missing") &&
        Array.isArray(observed["missing"]) && observed["missing"].length === 2 &&
        observed["missing"][0] === "incomplete" &&
        Array.isArray(observed["missing"][1]!) && observed["missing"][1]!.length === 1 &&
        Array.isArray(observed["missing"][1]![0]!) && observed["missing"][1]![0]!.length === 3 &&
        observed["missing"][1]![0]![0] === "air" &&
        observed["missing"][1]![0]![1] === null &&
        observed["missing"][1]![0]![2] === "not-run" &&
        Object.hasOwn(observed, "stale") &&
        Array.isArray(observed["stale"]) && observed["stale"].length === 3 &&
        observed["stale"][0] === "incomplete" &&
        typeof observed["stale"][1]! === "number" && nclose(observed["stale"][1]!, 1) &&
        observed["stale"][2] === true &&
        Object.hasOwn(observed, "refused") &&
        Array.isArray(observed["refused"]) && observed["refused"].length === 4 &&
        observed["refused"][0] === "incomplete" &&
        typeof observed["refused"][1]! === "number" && nclose(observed["refused"][1]!, 1) &&
        typeof observed["refused"][2]! === "number" && nclose(observed["refused"][2]!, 1) &&
        Array.isArray(observed["refused"][3]!) && observed["refused"][3]!.length === 2 &&
        observed["refused"][3]![0] === "unsupported" &&
        observed["refused"][3]![1] === "not-run" &&
        Object.hasOwn(observed, "gapped") &&
        Array.isArray(observed["gapped"]) && observed["gapped"].length === 3 &&
        observed["gapped"][0] === "incomplete" &&
        Array.isArray(observed["gapped"][1]!) && observed["gapped"][1]!.length === 2 &&
        Array.isArray(observed["gapped"][1]![0]!) && observed["gapped"][1]![0]!.length === 2 &&
        observed["gapped"][1]![0]![0] === "room.speechTransmissionIndex" &&
        observed["gapped"][1]![0]![1] === "not-run" &&
        Array.isArray(observed["gapped"][1]![1]!) && observed["gapped"][1]![1]!.length === 2 &&
        observed["gapped"][1]![1]![0] === "room.impulseResponse" &&
        observed["gapped"][1]![1]![1] === "unsupported" &&
        typeof observed["gapped"][2]! === "number" && nclose(observed["gapped"][2]!, 1) &&
        Object.hasOwn(observed, "failing") &&
        Array.isArray(observed["failing"]) && observed["failing"].length === 2 &&
        observed["failing"][0] === "misses" &&
        typeof observed["failing"][1]! === "number" && nclose(observed["failing"][1]!, 1)
      );
    })(),
  );

  const crowded: IAutoMovieAnalysisReport = summarizeAutoMovieAnalysis({
    runs: Array.from({ length: 5 }, (_: unknown, index: number): IAutoMovieAnalysisRun =>
      run(`skip-${index}`, {
        outcome: {
          status: "not-run",
          reason: `no input ${index}`,
          remedy: "declare it",
        },
      }),
    ),
    revision: "r7",
    required: ["acoustic"],
    maxGaps: 2,
  });
  TestValidator.predicate(
    "the report bounds its gap list and counts the rest",
    (() : boolean => {
      const observed: { listed: (string | null)[]; omitted: number; status: "meets" | "misses" | "incomplete"; } = {
      listed: crowded.gaps.map((entry: IAutoMovieAnalysisGap): string | null => entry.run),
      omitted: crowded.omittedGaps,
      status: crowded.status,
    };
      return (
        typeof observed === "object" && observed !== null && observed !== undefined &&
        Object.keys(observed).length === 3 &&
        Object.hasOwn(observed, "listed") &&
        Array.isArray(observed["listed"]) && observed["listed"].length === 2 &&
        observed["listed"][0] === "skip-0" &&
        observed["listed"][1] === "skip-1" &&
        Object.hasOwn(observed, "omitted") &&
        typeof observed["omitted"] === "number" && Number.isInteger(observed["omitted"]) && nclose(observed["omitted"], 3, 0) &&
        Object.hasOwn(observed, "status") &&
        observed["status"] === "incomplete"
      );
    })(),
  );

  const refusal: (reason: string, remedy: string) => string = (reason: string, remedy: string): string =>
    summarizeAutoMovieAnalysis({
      runs: [
        run("skip", { outcome: { status: "not-run", reason, remedy } }),
      ],
      revision: "r7",
      required: ["acoustic"],
    }).digest;
  TestValidator.equals(
    "moving a separator between a gap's reason and remedy changes the report digest",
    refusal("no input|declare", "it") !== refusal("no input", "declare|it"),
    true,
  );
}
