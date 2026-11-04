import { HumanSurveyData } from "../../internal/HumanSurveyData";

/** One response and its predictors, by column header. */
interface IRow {
  /** What the response stands for in the Human. */
  label: string;

  /** The response's column. */
  response: string;

  /** Candidate predictors' columns. */
  predictors: readonly string[];
}

/**
 * ANSUR 1988 columns: the natural waist's height (the site of the waist's
 * breadth and depth), the anterior superior iliac spines' breadth (the
 * pelvis's width), and the crotch lengths from the navel's level through the
 * crotch, in front and behind, which place the perineum along the trunk's
 * median section.
 */
const ANSUR_1988: readonly IRow[] = [
  { label: "natural waist height", response: "WAIST_HT_NATURAL", predictors: ["STATURE", "TENTH_RIB", "ILIOCRISTALE_HT"] },
  { label: "bispinous breadth", response: "BISPINOUS_BRTH", predictors: ["HIP_BRTH", "BUTTOCK_CIRC", "STATURE"] },
  { label: "crotch length, omphalion, posterior (as named)", response: "CRTCH_PST_OMPHALION", predictors: ["BUTTOCK_CIRC", "STATURE"] },
  { label: "crotch length, umbilicus (as named)", response: "CROTCH_UMBILICUS", predictors: ["BUTTOCK_CIRC", "STATURE"] },
];

/** ANSUR II columns: the crotch lengths at omphalion, total and posterior. */
const ANSUR_2: readonly IRow[] = [
  { label: "crotch length, omphalion, total", response: "crotchlengthomphalion", predictors: ["buttockcircumference", "stature"] },
  { label: "crotch length, omphalion, posterior", response: "crotchlengthposterioromphalion", predictors: ["buttockcircumference", "stature"] },
];

/**
 * A reading, not a check: the pelvis's measures the trunk's lower part
 * places by, the natural waist's height and the crotch's division of the
 * median section.
 *
 * The column names of ANSUR 1988's crotch lengths are printed with their
 * distributions, so their reading (front, posterior or total) is checked
 * against the report's definitions before a law takes them.
 *
 * Scenarios:
 * 1. For each sex of ANSUR 1988, prints the natural waist height, the bispinous breadth and the two crotch-length columns, each with its mean and SD and its line on every candidate predictor.
 * 2. For each sex of ANSUR II, prints the total and posterior crotch lengths at omphalion the same way, and the posterior share of the total.
 *
 * @evidence contracts/testing.md#behavioral-verification Fetches the public files into memory (`HumanSurveyData.load`), fits by ordinary least squares (`HumanSurveyData.line`) and prints. It writes no file and keeps no subject row.
 * @evidence contracts/testing.md#independent-expectations No expectation: a reading kept in its own removable file that no real test imports; the library's constants cite it by name.
 * @evidence contracts/testing.md#distinguishing-cases Both sexes of both surveys; each measure against every Human input that could predict it.
 * @evidence contracts/testing.md#execution-ownership An asynchronous unit reached by `--include human_survey_pelvis`; it needs the network to reach the public files and is part of no acceptance.
 */
export async function test_human_survey_pelvis(): Promise<void> {
  for (const [survey, rows] of [
    ["ansur1988", ANSUR_1988],
    ["ansur2", ANSUR_2],
  ] as const)
    for (const sex of ["female", "male"] as const) {
      const sample: HumanSurveyData.Sample = await HumanSurveyData.load(survey, sex);
      for (const row of rows) {
        const y: Float64Array = HumanSurveyData.column(sample, row.response);
        const s: HumanSurveyData.IStatistics = HumanSurveyData.statistics(y);
        console.log(`${survey} ${sex} ${row.label} (${row.response}): ${s.mean.toFixed(1)} (${s.sd.toFixed(1)}), n ${s.n}`);
        for (const predictor of row.predictors)
          console.log(`  on ${predictor}: ${HumanSurveyData.printed(HumanSurveyData.line(HumanSurveyData.column(sample, predictor), y))}`);
      }
      if (survey === "ansur2") {
        const total: Float64Array = HumanSurveyData.column(sample, "crotchlengthomphalion");
        const back: Float64Array = HumanSurveyData.column(sample, "crotchlengthposterioromphalion");
        const share: HumanSurveyData.IStatistics = HumanSurveyData.statistics(Float64Array.from(back, (b: number, i: number): number => b / total[i]!));
        console.log(`  posterior share of the omphalion crotch length: ${share.mean.toFixed(4)} (${share.sd.toFixed(4)})`);
      }
    }
}
