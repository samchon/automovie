import { summarizeAutoMovieAnalysis } from "../../../../packages/engine/src/analysis/summarizeAutoMovieAnalysis";
import type { IAutoMovieAnalysisRun, IAutoMovieAnalysisReport } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { throwsError, namedFacts } from "./predicates";

/** Execute the next ordered assertions of test_analysis_run_contract.
 *
 * Scenarios:
 * 1. a report over nothing, or over a run that cannot be read, does not exist.
 *
 * The report contract requires a nonblank revision, at least one known domain, a positive safe-integer gap bound, unique run ids and a readable seal. Each authored violation supplies its declared error fragment; no current report output generates the expected messages.
 * Blank revision, empty/unknown domains, fractional/zero gap limits, duplicated runs and an edited run digest throw. Earlier parts own coherent rollup arithmetic and precedence; the parent owns missing resident-record and comparison refusal propagation.
 */
export function assertAnalysisRunContractPart7(digest: (fill: string) => `sha256:${string}`, clean: IAutoMovieAnalysisRun): void {

  TestValidator.equals(
    "a report over nothing, or over a run that cannot be read, does not exist",
    namedFacts([
      [
        "blank revision",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisReport =>
              summarizeAutoMovieAnalysis({
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
              summarizeAutoMovieAnalysis({
                runs: [],
                revision: "r7",
                required: [],
              }),
            "cannot clear anything",
          ),
      ],
      [
        "unknown required domain",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisReport =>
              summarizeAutoMovieAnalysis({
                runs: [],
                revision: "r7",
                required: [
                  "structural" as unknown as IAutoMovieAnalysisRun["domain"],
                ],
              }),
            "unknown required analysis domain",
          ),
      ],
      [
        "fractional gap bound",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisReport =>
              summarizeAutoMovieAnalysis({
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
              summarizeAutoMovieAnalysis({
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
              summarizeAutoMovieAnalysis({
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
              summarizeAutoMovieAnalysis({
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
      "unknown required domain": true,
      "fractional gap bound": true,
      "zero gap bound": true,
      "a duplicated run": true,
      "an unreadable run": true,
    },
  );
}
