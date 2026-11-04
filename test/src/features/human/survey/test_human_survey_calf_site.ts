import { HumanSurveyData } from "../../internal/HumanSurveyData";

/**
 * A reading, not a check: the height of the calf's greatest girth, the site of
 * ISO 8559-1 5.3.24.
 *
 * ANSUR 1988 takes the calf height (`CALF_HT`, the floor to the level of the
 * calf circumference) with stature, the lateral malleolus height and the tibiale's
 * stand-in, the midpatella height, on the same subjects; ANSUR II takes none.
 * The site is read as its share of the shank from the outer ankle point to
 * mid-patella and as a line on stature.
 *
 * Scenarios:
 * 1. For each sex of ANSUR 1988, prints the calf height's mean and SD, its line on stature with R2 and residual SD, and its share of the span from the lateral malleolus to mid-patella with mean and SD.
 *
 * @evidence contracts/testing.md#behavioral-verification Fetches the two ANSUR 1988 files into memory (`HumanSurveyData.load`) and prints the site's distribution, line and share. It writes no file and keeps no subject row.
 * @evidence contracts/testing.md#independent-expectations No expectation: a reading kept in its own removable file that no real test imports; the library's constants cite it by name.
 * @evidence contracts/testing.md#distinguishing-cases Both sexes; the share and the stature line are the two forms a construction may read.
 * @evidence contracts/testing.md#execution-ownership An asynchronous unit reached by `--include human_survey_calf_site`; it needs the network to reach the public files and is part of no acceptance.
 */
export async function test_human_survey_calf_site(): Promise<void> {
  for (const sex of ["female", "male"] as const) {
    const sample: HumanSurveyData.Sample = await HumanSurveyData.load("ansur1988", sex);
    const calf: Float64Array = HumanSurveyData.column(sample, "CALF_HT");
    const stature: Float64Array = HumanSurveyData.column(sample, "STATURE");
    const malleolus: Float64Array = HumanSurveyData.column(sample, "LATERAL-MALLEOUS_HT");
    const patella: Float64Array = HumanSurveyData.column(sample, "PATELLA-MID_HT");
    const s: HumanSurveyData.IStatistics = HumanSurveyData.statistics(calf);
    const share: HumanSurveyData.IStatistics = HumanSurveyData.statistics(
      Float64Array.from(calf, (c: number, i: number): number => (c - malleolus[i]!) / (patella[i]! - malleolus[i]!)),
    );
    console.log(`ansur1988 ${sex} calf height ${s.mean.toFixed(1)} (${s.sd.toFixed(1)}), n ${s.n}; on stature: ${HumanSurveyData.printed(HumanSurveyData.line(stature, calf))}`);
    console.log(`  share of lateral malleolus to mid-patella: ${share.mean.toFixed(4)} (${share.sd.toFixed(4)})`);
  }
}
