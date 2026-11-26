import { AutoMovieEngineAnalysis } from "@automovie/engine";
import type {
  IAutoMovieAnalysisReport,
  IAutoMovieAnalysisRun,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, throwsError } from "./predicates";

/**
 * Execute the next ordered assertions of test_analysis_run_contract.
 *
 * Scenarios:
 *
 * 1. A report over nothing, or over a run that cannot be read, does not exist.
 *
 * The report contract requires a nonblank revision, at least one domain, a
 * positive safe-integer gap bound, unique run ids and a readable seal. Each
 * authored violation supplies its declared error fragment; no current report
 * output generates the expected messages. Blank revision, empty domains,
 * fractional/zero gap limits, duplicated runs and an edited run digest throw.
 * Earlier parts own coherent rollup arithmetic and precedence; the parent owns
 * missing resident-record and comparison refusal propagation.
 */
export function assertAnalysisRunContractPart7(
  digest: (fill: string) => `sha256:${string}`,
  clean: IAutoMovieAnalysisRun,
): void {
  TestValidator.equals(
    "a report over nothing, or over a run that cannot be read, does not exist",
    namedFacts([
      [
        "blank revision",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisReport =>
              AutoMovieEngineAnalysis.summarizeAnalysis({
                runs: [],
                revision: " ",
                required: ["acoustic"],
              }),
            "state the design revision",
          ),
      ],
      [
        "no required domain",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisReport =>
              AutoMovieEngineAnalysis.summarizeAnalysis({
                runs: [],
                revision: "r7",
                required: [],
              }),
            "cannot clear anything",
          ),
      ],

      [
        "fractional gap bound",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisReport =>
              AutoMovieEngineAnalysis.summarizeAnalysis({
                runs: [],
                revision: "r7",
                required: ["acoustic"],
                maxGaps: 1.5,
              }),
            "positive safe integer",
          ),
      ],
      [
        "zero gap bound",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisReport =>
              AutoMovieEngineAnalysis.summarizeAnalysis({
                runs: [],
                revision: "r7",
                required: ["acoustic"],
                maxGaps: 0,
              }),
            "positive safe integer",
          ),
      ],
      [
        "a duplicated run",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisReport =>
              AutoMovieEngineAnalysis.summarizeAnalysis({
                runs: [clean, clean],
                revision: "r7",
                required: ["acoustic"],
              }),
            "reported more than once",
          ),
      ],
      [
        "an unreadable run",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisReport =>
              AutoMovieEngineAnalysis.summarizeAnalysis({
                runs: [{ ...clean, digest: digest("b") }],
                revision: "r7",
                required: ["acoustic"],
              }),
            "cannot be reported at",
          ),
      ],
    ]),
    {
      "blank revision": true,
      "no required domain": true,
      "fractional gap bound": true,
      "zero gap bound": true,
      "a duplicated run": true,
      "an unreadable run": true,
    },
  );
}
