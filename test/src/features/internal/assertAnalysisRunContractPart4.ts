import {
  AUTOMOVIE_ANALYSIS_MAX_SAMPLES,
  autoMovieAnalysisMetric,
} from "@automovie/engine";
import type {
  IAutoMovieAnalysisMetric,
  IAutoMovieAnalysisSample,
  IAutoMovieAnalysisWarning,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { hasViolation, namedFacts } from "./predicates";

/** Execute the next ordered assertions of test_analysis_run_contract.
 *
 * Scenarios:
 * 1. a field may only be drawn for a metric that produced a value.
 * 2. a warning must say something about something.
 *
 * A sample must name a measured metric, have a distinct id; a warning requires nonblank code/detail and a null or nonblank subject. These authored schema requirements determine the exact type/range paths. The sample-limit case is relative to the published bound and does not independently pin its numeric value.
 * Two valid samples contrast with gapped/unknown metric keys, duplicate ids and one sample beyond the bound. Complete warnings with null/named subjects contrast with each blank field. This part returns the warning sink and metric-builder closure; later parts own builder target semantics and summary results.
 */
export function assertAnalysisRunContractPart4(
  measured: (
    overrides?: Partial<IAutoMovieAnalysisMetric>,
  ) => IAutoMovieAnalysisMetric,
  solved: (
    metrics: IAutoMovieAnalysisMetric[],
    samples?: IAutoMovieAnalysisSample[],
    warnings?: IAutoMovieAnalysisWarning[],
  ) => IAutoMovieValidation,
  absent: (
    overrides?: Partial<IAutoMovieAnalysisMetric>,
  ) => IAutoMovieAnalysisMetric,
  at: (id: string, key: string, value?: number) => IAutoMovieAnalysisSample,
): {
  warnings: IAutoMovieAnalysisWarning[];
  build: (
    value: number | null,
    targets: Parameters<typeof autoMovieAnalysisMetric>[0]["targets"],
    extra?: Partial<Parameters<typeof autoMovieAnalysisMetric>[0]>,
  ) => IAutoMovieAnalysisMetric;
} {
  TestValidator.equals(
    "a field may only be drawn for a metric that produced a value",
    namedFacts([
      [
        "a real field",
        (): boolean =>
          solved(
            [measured()],
            [
              at("a", "room.reverberationTime"),
              at("b", "room.reverberationTime"),
            ],
          ).success,
      ],
      [
        "a field of nothing",
        (): boolean =>
          hasViolation(
            solved([absent()], [at("a", "room.reverberationTime")]),
            "type",
            "$input.outcome.samples[0].key",
          ),
      ],
      [
        "a field of an unknown metric",
        (): boolean =>
          hasViolation(
            solved([measured()], [at("a", "room.clarity")]),
            "type",
            "$input.outcome.samples[0].key",
          ),
      ],
      [
        "a duplicated sample id",
        (): boolean =>
          hasViolation(
            solved(
              [measured()],
              [
                at("a", "room.reverberationTime"),
                at("a", "room.reverberationTime"),
              ],
            ),
            "type",
            "$input.outcome.samples[1].id",
          ),
      ],
      [
        "a grid past the bound",
        (): boolean =>
          hasViolation(
            solved(
              [measured()],
              Array.from(
                { length: AUTOMOVIE_ANALYSIS_MAX_SAMPLES + 1 },
                (_: unknown, index: number): IAutoMovieAnalysisSample =>
                  at(`s${index}`, "room.reverberationTime"),
              ),
            ),
            "range",
            "$input.outcome.samples",
          ),
      ],
    ]),
    {
      "a real field": true,
      "a field of nothing": true,
      "a field of an unknown metric": true,
      "a duplicated sample id": true,
      "a grid past the bound": true,
    },
  );

  TestValidator.equals(
    "a warning must say something about something",
    namedFacts([
      [
        "stated in full",
        (): boolean =>
          solved(
            [measured()],
            [],
            [
              {
                code: "reverse-heat-flow",
                detail: "indoor is colder",
                subject: null,
              },
            ],
          ).success,
      ],
      [
        "about a named subject",
        (): boolean =>
          solved(
            [measured()],
            [],
            [{ code: "c", detail: "d", subject: "assembly:wall" }],
          ).success,
      ],
      [
        "blank code",
        (): boolean =>
          hasViolation(
            solved(
              [measured()],
              [],
              [{ code: " ", detail: "d", subject: null }],
            ),
            "type",
            "$input.outcome.warnings[0].code",
          ),
      ],
      [
        "blank detail",
        (): boolean =>
          hasViolation(
            solved(
              [measured()],
              [],
              [{ code: "c", detail: "", subject: null }],
            ),
            "type",
            "$input.outcome.warnings[0].detail",
          ),
      ],
      [
        "blank subject",
        (): boolean =>
          hasViolation(
            solved(
              [measured()],
              [],
              [{ code: "c", detail: "d", subject: " " }],
            ),
            "type",
            "$input.outcome.warnings[0].subject",
          ),
      ],
    ]),
    {
      "stated in full": true,
      "about a named subject": true,
      "blank code": true,
      "blank detail": true,
      "blank subject": true,
    },
  );

  const warnings: IAutoMovieAnalysisWarning[] = [];
  const build: (
    value: number | null,
    targets: Parameters<typeof autoMovieAnalysisMetric>[0]["targets"],
    extra?: Partial<Parameters<typeof autoMovieAnalysisMetric>[0]>,
  ) => IAutoMovieAnalysisMetric = (
    value: number | null,
    targets: Parameters<typeof autoMovieAnalysisMetric>[0]["targets"],
    extra: Partial<Parameters<typeof autoMovieAnalysisMetric>[0]> = {},
  ): IAutoMovieAnalysisMetric =>
    autoMovieAnalysisMetric({
      key: "room.reverberationTime",
      unit: "s",
      value,
      targets,
      warnings,
      ...extra,
    });
  return { warnings, build };
}
