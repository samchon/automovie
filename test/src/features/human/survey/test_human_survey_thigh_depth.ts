import { HumanSurveyData } from "../../internal/HumanSurveyData";

/**
 * A reading, not a check: the thigh's depth, the one limb depth the surveys
 * take.
 *
 * ANSUR II's thigh clearance (and ANSUR 1988's) is the vertical distance from
 * the sitting surface to the highest point of the thigh, sitting with the
 * thigh horizontal: the thigh's depth at its thickest, with the underside
 * resting on the seat (Gordon et al. 2014). It is read against the thigh
 * girth at the gluteal furrow (ANSUR II) and the proximal thigh girth just
 * below the furrow (ANSUR 1988, the Human's `thighCircumference`), so the
 * thigh's depth at its tape site can follow the girth.
 *
 * Scenarios:
 * 1. For each sex of ANSUR II and ANSUR 1988, prints the thigh clearance's mean and SD, its line on the thigh girth with R2 and residual SD, and its ratio to the girth over pi (the depth a circle of that girth would have).
 *
 * @evidence contracts/testing.md#behavioral-verification Fetches the public files into memory (`HumanSurveyData.load`), fits by ordinary least squares (`HumanSurveyData.line`) and prints. It writes no file and keeps no subject row.
 * @evidence contracts/testing.md#independent-expectations No expectation: a reading kept in its own removable file that no real test imports; the library's constants cite it by name.
 * @evidence contracts/testing.md#distinguishing-cases Both sexes of both surveys; the ratio to a circle's depth shows how far the seated, compressed thigh departs from a round section.
 * @evidence contracts/testing.md#execution-ownership An asynchronous unit reached by `--include human_survey_thigh_depth`; it needs the network to reach the public files and is part of no acceptance.
 */
export async function test_human_survey_thigh_depth(): Promise<void> {
  for (const [survey, depthColumn, girthColumn] of [
    ["ansur2", "thighclearance", "thighcircumference"],
    ["ansur1988", "THIGH_CLEARANCE", "THIGH_CIRC-PROXIMAL"],
  ] as const)
    for (const sex of ["female", "male"] as const) {
      const sample: HumanSurveyData.Sample = await HumanSurveyData.load(survey, sex);
      const depth: Float64Array = HumanSurveyData.column(sample, depthColumn);
      const girth: Float64Array = HumanSurveyData.column(sample, girthColumn);
      const s: HumanSurveyData.IStatistics = HumanSurveyData.statistics(depth);
      const ratio: HumanSurveyData.IStatistics = HumanSurveyData.statistics(Float64Array.from(depth, (d: number, i: number): number => (d * Math.PI) / girth[i]!));
      console.log(`${survey} ${sex} thigh clearance ${s.mean.toFixed(1)} (${s.sd.toFixed(1)}), n ${s.n}; on ${girthColumn}: ${HumanSurveyData.printed(HumanSurveyData.line(girth, depth))}`);
      console.log(`  over the girth's circle depth: ${ratio.mean.toFixed(4)} (${ratio.sd.toFixed(4)})`);
    }
}
