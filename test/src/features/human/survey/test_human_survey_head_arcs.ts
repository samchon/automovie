import { HumanSurveyData } from "../../internal/HumanSurveyData";

/** One response and its predictors, by column header. */
interface IRow {
  /** What the response stands for in the Human. */
  label: string;

  /** The response's column. */
  response: string;

  /** Candidate predictors' columns, each a Human head input's survey measure. */
  predictors: readonly string[];
}

/**
 * ANSUR 1988's six bitragion arcs (over the head from tragion to tragion
 * through the named landmark), the ear's length above tragion, and their
 * candidate predictors among the Human's head inputs: the head's
 * circumference, length and breadth, the bizygomatic breadth (`faceWidth`)
 * and menton to the nasal root (the face's height).
 */
const ANSUR_1988: readonly IRow[] = [
  { label: "bitragion coronal arc", response: "BITR-CORONAL_ARC", predictors: ["HEAD_CIRC", "HEAD_BRTH", "HEAD_LNTH"] },
  { label: "bitragion crinion arc", response: "BITR-CRINION_ARC", predictors: ["HEAD_CIRC", "HEAD_BRTH", "HEAD_LNTH"] },
  { label: "bitragion minimum frontal arc", response: "BITR-MINIMUM_FRNTAL_ARC", predictors: ["HEAD_CIRC", "HEAD_BRTH", "BIZYGOMATIC_BRTH"] },
  { label: "bitragion subnasale arc", response: "BITR_SUBNASALE_ARC", predictors: ["BIZYGOMATIC_BRTH", "HEAD_CIRC", "HEAD_BRTH"] },
  { label: "bitragion menton arc", response: "BITR_MENTON_ARC", predictors: ["BIZYGOMATIC_BRTH", "MENTON_TO_NASAL_ROOT_DEP_LNTH", "HEAD_CIRC"] },
  { label: "bitragion submandibular arc", response: "BITR_SUBMANDIBULAR_ARC", predictors: ["BIZYGOMATIC_BRTH", "HEAD_CIRC", "MENTON_TO_NASAL_ROOT_DEP_LNTH"] },
  { label: "ear length above tragion", response: "EAR_LNTH-ABOVE_TRAGION", predictors: ["EAR_LNTH"] },
];

/** ANSUR II's tragion to the top of the head and its two bitragion arcs. */
const ANSUR_2: readonly IRow[] = [
  { label: "tragion to top of head", response: "tragiontopofhead", predictors: ["headlength", "headbreadth", "headcircumference", "stature"] },
  { label: "bitragion chin arc", response: "bitragionchinarc", predictors: ["bizygomaticbreadth", "mentonsellionlength", "headcircumference"] },
  { label: "bitragion submandibular arc", response: "bitragionsubmandibulararc", predictors: ["bizygomaticbreadth", "mentonsellionlength", "headcircumference"] },
];

/**
 * A reading, not a check: the head's surface arcs and the tragion's height,
 * the defaults the head mass's fullness and the ear's place would take from
 * the Human's head inputs.
 *
 * Scenarios:
 * 1. For each sex of ANSUR 1988, prints each bitragion arc and the ear's length above tragion, with mean and SD and the line on every candidate predictor.
 * 2. For each sex of ANSUR II, prints the tragion to the top of the head and the two bitragion arcs the same way.
 *
 * @evidence contracts/testing.md#behavioral-verification Fetches the public files into memory (`HumanSurveyData.load`), fits by ordinary least squares (`HumanSurveyData.line`) and prints. It writes no file and keeps no subject row.
 * @evidence contracts/testing.md#independent-expectations No expectation: a reading kept in its own removable file that no real test imports; the library's constants cite it by name.
 * @evidence contracts/testing.md#distinguishing-cases Both sexes of both surveys; each measure against every Human head input that could predict it.
 * @evidence contracts/testing.md#execution-ownership An asynchronous unit reached by `--include human_survey_head_arcs`; it needs the network to reach the public files and is part of no acceptance.
 */
export async function test_human_survey_head_arcs(): Promise<void> {
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
    }
}
