import { HumanSurveyData } from "../../internal/HumanSurveyData";

/**
 * A reading, not a check: the natural-waist breadth and depth defaults of
 * `AutoMovieHumanBodyAnatomy.resolve`, derived from the navel-level section.
 *
 * No public survey takes a breadth or a depth at the natural waist: ANSUR 1988
 * and ANSUR II both take them at omphalion (`WAIST_BRTH_OMPHALION`,
 * `WAIST_DEPTH-OMPHALION`; `waistbreadth`, `waistdepth`). The default
 * therefore applies the omphalion section's law, breadth and depth on the girth
 * of the same level fitted on ANSUR 1988 by sex, at the natural-waist girth,
 * assuming the lumbar section keeps its breadth-on-girth and depth-on-girth law
 * over the 70 mm between the two levels. This reading prints the fitted lines,
 * the distance between the levels, the values the law gives at each subject's
 * natural girth and how many subjects' derived boxes would contradict their own
 * natural girth.
 *
 * Scenarios:
 * 1. For each sex of ANSUR 1988, prints the omphalion breadth and depth, each on the omphalion girth, with R2 and residual SD; the mean and SD of the natural level's height over the omphalion's.
 * 2. For each sex, evaluates both lines at every subject's natural-waist girth and prints the derived breadth's and depth's mean and SD, and the share of subjects whose natural girth falls below the rhombus `2 sqrt(W^2 + D^2)` or above the box `2 (W + D)` of the derived pair.
 * 3. For comparison, prints the omphalion breadth and depth on the natural-waist girth, the line that predicts the navel section from the natural girth rather than the natural section.
 *
 * @evidence contracts/testing.md#behavioral-verification Fetches the two ANSUR 1988 files into memory (`HumanSurveyData.load`), fits by ordinary least squares (`HumanSurveyData.line`) and evaluates the lines per subject; prints only. It writes no file and keeps no subject row.
 * @evidence contracts/testing.md#independent-expectations No expectation: a reading kept in its own removable file that no real test imports; the library's constants cite it by name.
 * @evidence contracts/testing.md#distinguishing-cases Both sexes; the derived section against each subject's own natural girth, and the navel section's line on the natural girth as the alternative the derivation was chosen over.
 * @evidence contracts/testing.md#execution-ownership An asynchronous unit reached by `--include human_survey_waist_section`; it needs the network to reach the public files and is part of no acceptance.
 */
export async function test_human_survey_waist_section(): Promise<void> {
  for (const sex of ["female", "male"] as const) {
    const sample: HumanSurveyData.Sample = await HumanSurveyData.load("ansur1988", sex);
    const navel: Float64Array = HumanSurveyData.column(sample, "WAIST_CIRC-OMPHALION");
    const natural: Float64Array = HumanSurveyData.column(sample, "WAIST_CIRC_NATURAL");
    const breadth: HumanSurveyData.ILine = HumanSurveyData.line(navel, HumanSurveyData.column(sample, "WAIST_BRTH_OMPHALION"));
    const depth: HumanSurveyData.ILine = HumanSurveyData.line(navel, HumanSurveyData.column(sample, "WAIST_DEPTH-OMPHALION"));
    console.log(`ansur1988 ${sex} omphalion breadth on omphalion girth: ${HumanSurveyData.printed(breadth)}`);
    console.log(`ansur1988 ${sex} omphalion depth on omphalion girth: ${HumanSurveyData.printed(depth)}`);

    // The levels' distance, natural over omphalion, per subject.
    const high: Float64Array = HumanSurveyData.column(sample, "WAIST_HT_NATURAL");
    const low: Float64Array = HumanSurveyData.column(sample, "WAIST_HT-OMPHALION");
    const rise: HumanSurveyData.IStatistics = HumanSurveyData.statistics(Float64Array.from(high, (h: number, i: number): number => h - low[i]!));
    console.log(`ansur1988 ${sex} natural waist height over omphalion height: ${rise.mean.toFixed(1)} (${rise.sd.toFixed(1)}), n ${rise.n}`);

    // The law at each subject's natural girth, and the derived box against
    // that girth.
    const w: Float64Array = Float64Array.from(natural, (g: number): number => breadth.a + breadth.b * g);
    const d: Float64Array = Float64Array.from(natural, (g: number): number => depth.a + depth.b * g);
    const ws: HumanSurveyData.IStatistics = HumanSurveyData.statistics(w);
    const ds: HumanSurveyData.IStatistics = HumanSurveyData.statistics(d);
    let below: number = 0;
    let above: number = 0;
    for (let i: number = 0; i < natural.length; i++) {
      if (natural[i]! < 2 * Math.hypot(w[i]!, d[i]!)) below++;
      if (natural[i]! > 2 * (w[i]! + d[i]!)) above++;
    }
    console.log(
      `ansur1988 ${sex} derived natural breadth ${ws.mean.toFixed(1)} (${ws.sd.toFixed(1)}), depth ${ds.mean.toFixed(1)} (${ds.sd.toFixed(1)}); girth below the rhombus ${below}, above the box ${above} of ${natural.length}`,
    );

    // The alternative: the navel section predicted from the natural girth.
    console.log(`  navel breadth on natural girth: ${HumanSurveyData.printed(HumanSurveyData.line(natural, HumanSurveyData.column(sample, "WAIST_BRTH_OMPHALION")))}`);
    console.log(`  navel depth on natural girth: ${HumanSurveyData.printed(HumanSurveyData.line(natural, HumanSurveyData.column(sample, "WAIST_DEPTH-OMPHALION")))}`);
  }
}
