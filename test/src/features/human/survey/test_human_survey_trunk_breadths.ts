import { HumanSurveyData } from "../../internal/HumanSurveyData";

/** One response and the predictors it is read against, by column header. */
interface IRow {
  /** The Human anatomy field the response stands for. */
  field: string;

  /** The response's column. */
  response: string;

  /** Candidate predictors' columns, each a Human input or a survey-only girth for comparison. */
  predictors: readonly string[];
}

/**
 * ANSUR 1988 columns of the trunk's breadths and depths and their candidate
 * predictors. The chest, natural waist and buttock girths and the stature and
 * biacromial breadth are Human inputs (`IAutoMovieHumanBodyAnatomy`); the
 * shoulder circumference over the deltoids is not, and is printed only to show
 * how much a bideltoid default loses without the girth of its own level.
 */
const ANSUR_1988: readonly IRow[] = [
  { field: "chestBreadth", response: "CHEST_BRTH", predictors: ["CHEST_CIRC"] },
  { field: "chestDepth", response: "CHEST_DEPTH", predictors: ["CHEST_CIRC"] },
  { field: "hipBreadth", response: "HIP_BRTH", predictors: ["BUTTOCK_CIRC"] },
  { field: "buttockDepth", response: "BUTT_DEPTH", predictors: ["BUTTOCK_CIRC"] },
  {
    field: "bideltoidBreadth",
    response: "BIDELTOID_BRTH",
    predictors: ["CHEST_CIRC", "BIACROMIAL_BRTH", "STATURE", "BUTTOCK_CIRC", "WAIST_CIRC_NATURAL", "SHOULDER_CIRC"],
  },
];

/**
 * ANSUR II columns of the bicristal breadth, which ANSUR 1988 does not take
 * (its `BISPINOUS_BRTH` is between the anterior superior iliac spines), and its
 * candidate predictors: the buttock girth and stature are Human inputs; the
 * navel-level waist girth and the hip breadth are printed for comparison.
 */
const ANSUR_2: readonly IRow[] = [
  {
    field: "bicristalBreadth",
    response: "bicristalbreadth",
    predictors: ["buttockcircumference", "stature", "hipbreadth", "waistcircumference"],
  },
];

/**
 * A reading, not a check: the survey lines that default the trunk's published
 * breadths and depths in `AutoMovieHumanBodyAnatomy.resolve`, refitted from the
 * public working databases so every coefficient there can be reproduced.
 *
 * Scenarios:
 * 1. For each sex of ANSUR 1988, prints the mean and SD of chest breadth, chest depth, hip breadth, buttock depth and bideltoid breadth, and the ordinary least squares line of each on every candidate predictor with its R2 and residual SD.
 * 2. For each sex of ANSUR II, prints the same for the bicristal breadth.
 *
 * @evidence contracts/testing.md#behavioral-verification Fetches the four public files into memory (`HumanSurveyData.load`), fits each response on each candidate predictor by ordinary least squares over the subjects with both values present (`HumanSurveyData.line`) and prints the lines and distributions. It writes no file and keeps no subject row.
 * @evidence contracts/testing.md#independent-expectations No expectation: a reading kept in its own removable file that no real test imports; the library's constants cite it by name.
 * @evidence contracts/testing.md#distinguishing-cases Both sexes of both surveys; each response against every Human input that could predict it, and against the survey-only girth of its own level where the Human has none.
 * @evidence contracts/testing.md#execution-ownership An asynchronous unit reached by `--include human_survey_trunk_breadths`; it needs the network to reach the public files and is part of no acceptance.
 */
export async function test_human_survey_trunk_breadths(): Promise<void> {
  for (const [survey, rows] of [
    ["ansur1988", ANSUR_1988],
    ["ansur2", ANSUR_2],
  ] as const)
    for (const sex of ["female", "male"] as const) {
      const sample: HumanSurveyData.Sample = await HumanSurveyData.load(survey, sex);
      for (const row of rows) {
        const y: Float64Array = HumanSurveyData.column(sample, row.response);
        const s: HumanSurveyData.IStatistics = HumanSurveyData.statistics(y);
        console.log(`${survey} ${sex} ${row.field} (${row.response}): ${s.mean.toFixed(1)} (${s.sd.toFixed(1)}), n ${s.n}`);
        for (const predictor of row.predictors)
          console.log(`  on ${predictor}: ${HumanSurveyData.printed(HumanSurveyData.line(HumanSurveyData.column(sample, predictor), y))}`);
      }
    }
}
