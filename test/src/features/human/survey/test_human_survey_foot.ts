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
 * ANSUR II's foot measures beyond the length and breadth the Human already
 * takes: the girth over the metatarsal heads (the forefoot's fullness), the
 * girth round the heel and the instep (the dorsum's height), the ball of foot
 * length and the heel breadth.
 */
const ANSUR_2: readonly IRow[] = [
  { label: "ball of foot circumference", response: "balloffootcircumference", predictors: ["footbreadthhorizontal", "footlength"] },
  { label: "heel-ankle circumference", response: "heelanklecircumference", predictors: ["footlength", "heelbreadth", "anklecircumference"] },
  { label: "ball of foot length", response: "balloffootlength", predictors: ["footlength"] },
  { label: "heel breadth", response: "heelbreadth", predictors: ["footbreadthhorizontal"] },
];

/** ANSUR 1988's foot measures ANSUR II does not take: the instep length and the foot's own girth. */
const ANSUR_1988: readonly IRow[] = [
  { label: "instep length", response: "INSTEP_LNTH", predictors: ["FOOT_LNTH"] },
  { label: "foot circumference", response: "FOOT_CIRC", predictors: ["FOOT_BRTH", "FOOT_LNTH"] },
  { label: "heel-ankle circumference", response: "HEEL_ANKLE_CIRC", predictors: ["FOOT_LNTH", "HEEL_BRTH"] },
];

/**
 * A reading, not a check: the foot's published measures and their lines on
 * the foot inputs the Human already has, the defaults the foot's added inputs
 * would take.
 *
 * Scenarios:
 * 1. For each sex of ANSUR II, prints the ball of foot and heel-ankle circumferences, the ball of foot length and the heel breadth, each with its mean and SD and its line on every candidate predictor.
 * 2. For each sex of ANSUR 1988, prints the instep length, the foot circumference and the heel-ankle circumference the same way.
 *
 * @evidence contracts/testing.md#behavioral-verification Fetches the public files into memory (`HumanSurveyData.load`), fits by ordinary least squares (`HumanSurveyData.line`) and prints. It writes no file and keeps no subject row.
 * @evidence contracts/testing.md#independent-expectations No expectation: a reading kept in its own removable file that no real test imports; the library's constants cite it by name.
 * @evidence contracts/testing.md#distinguishing-cases Both sexes of both surveys; each measure against every Human input that could predict it.
 * @evidence contracts/testing.md#execution-ownership An asynchronous unit reached by `--include human_survey_foot`; it needs the network to reach the public files and is part of no acceptance.
 */
export async function test_human_survey_foot(): Promise<void> {
  for (const [survey, rows] of [
    ["ansur2", ANSUR_2],
    ["ansur1988", ANSUR_1988],
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
    }
}
