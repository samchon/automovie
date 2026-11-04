import { HumanSurveyData } from "../../internal/HumanSurveyData";

/**
 * A reading, not a check: the chest wall's box, breadth and depth on the girth
 * that wraps it, the law behind the underbust's depth and breadth.
 *
 * No survey takes a breadth or depth at the inframammary fold. Heinz et al.
 * 2003 take the rib cage's own: chest depth from the mid-sternum to the spine
 * and chest diameter across the rib cage, both at the nipple line by caliper,
 * and the chest girth at the nipple line in men and just above the breast
 * tissue in women, so in both sexes the three measures describe the thorax
 * without the breasts. Evaluated at the underbust girth, which wraps the same
 * thorax just under the breasts, these lines give the underbust's box,
 * assuming the thorax keeps its depth-on-girth and breadth-on-girth law over
 * the few centimetres between the two levels.
 *
 * Scenarios:
 * 1. For each sex of Heinz et al. 2003, prints the chest depth and the chest diameter (mm) each on the chest girth (mm), with R2 and residual SD, and the depth over diameter's mean and SD.
 * 2. For each sex, prints the share of subjects whose chest girth falls outside the box range of their own depth and diameter.
 *
 * @evidence contracts/testing.md#behavioral-verification Fetches the public file into memory (`HumanSurveyData.load`), converts centimetres to millimetres, fits by ordinary least squares (`HumanSurveyData.line`) and prints. It writes no file and keeps no subject row.
 * @evidence contracts/testing.md#independent-expectations No expectation: a reading kept in its own removable file that no real test imports; the library's constants cite it by name.
 * @evidence contracts/testing.md#distinguishing-cases Both sexes; the box range check shows whether the caliper breadth and depth bound the girth as a taut tape's box.
 * @evidence contracts/testing.md#execution-ownership An asynchronous unit reached by `--include human_survey_chest_wall`; it needs the network to reach the public file and is part of no acceptance.
 */
export async function test_human_survey_chest_wall(): Promise<void> {
  for (const sex of ["female", "male"] as const) {
    const sample: HumanSurveyData.Sample = await HumanSurveyData.load("heinz2003", sex);
    const mm = (name: string): Float64Array => Float64Array.from(HumanSurveyData.column(sample, name), (cm: number): number => 10 * cm);
    const girth: Float64Array = mm("che_gi");
    const depth: Float64Array = mm("che_de");
    const breadth: Float64Array = mm("che_di");
    console.log(`heinz2003 ${sex} chest depth on chest girth: ${HumanSurveyData.printed(HumanSurveyData.line(girth, depth))}`);
    console.log(`heinz2003 ${sex} chest diameter on chest girth: ${HumanSurveyData.printed(HumanSurveyData.line(girth, breadth))}`);
    const ratio: HumanSurveyData.IStatistics = HumanSurveyData.statistics(Float64Array.from(depth, (d: number, i: number): number => d / breadth[i]!));
    let outside: number = 0;
    for (let i: number = 0; i < girth.length; i++)
      if (girth[i]! < 2 * Math.hypot(depth[i]!, breadth[i]!) || girth[i]! > 2 * (depth[i]! + breadth[i]!)) outside++;
    console.log(`heinz2003 ${sex} depth over diameter ${ratio.mean.toFixed(3)} (${ratio.sd.toFixed(3)}), n ${ratio.n}; girth outside its box ${outside} of ${girth.length}`);
  }
}
