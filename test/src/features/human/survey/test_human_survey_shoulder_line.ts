import { HumanSurveyData } from "../../internal/HumanSurveyData";

/**
 * A reading, not a check: the shoulder's top line from the side neck point to
 * the acromion, the trunk's front outline above the axilla.
 *
 * ANSUR 1988 takes, on the same subjects, the lateral neck height (the side
 * neck point above the floor), the acromial height and the shoulder length
 * (side neck point to acromion over the skin). The line's drop is the two
 * heights' difference; its horizontal run is the shoulder length's chord less
 * that drop, `sqrt(L^2 - drop^2)`, treating the skin path as straight, which
 * makes the run an upper bound and the slope a lower bound. The slope below
 * the horizontal is `atan(drop / run)`.
 *
 * Scenarios:
 * 1. For each sex of ANSUR 1988, prints the shoulder length, the drop and the slope's mean and SD and their 1st and 99th percentiles, beside the FAA 1965 slope recorded in `faa-1965-shoulder-slope.md`.
 * 2. For each sex, prints the drop on the shoulder length and the run on the biacromial breadth, with R2.
 *
 * @evidence contracts/testing.md#behavioral-verification Fetches the two ANSUR 1988 files into memory (`HumanSurveyData.load`), derives each subject's drop, run and slope, and prints their distributions and lines. It writes no file and keeps no subject row.
 * @evidence contracts/testing.md#independent-expectations No expectation: a reading kept in its own removable file that no real test imports; the library's constants cite it by name.
 * @evidence contracts/testing.md#distinguishing-cases Both sexes; a subject whose drop exceeds its shoulder length (a recording error) is counted and left out.
 * @evidence contracts/testing.md#execution-ownership An asynchronous unit reached by `--include human_survey_shoulder_line`; it needs the network to reach the public files and is part of no acceptance.
 */
export async function test_human_survey_shoulder_line(): Promise<void> {
  for (const sex of ["female", "male"] as const) {
    const sample: HumanSurveyData.Sample = await HumanSurveyData.load("ansur1988", sex);
    const neck: Float64Array = HumanSurveyData.column(sample, "NECK_HT-LATERAL");
    const acromion: Float64Array = HumanSurveyData.column(sample, "ACROMION_HT");
    const length: Float64Array = HumanSurveyData.column(sample, "SHOULDER_LNTH");
    const biacromial: Float64Array = HumanSurveyData.column(sample, "BIACROMIAL_BRTH");
    const drops: number[] = [];
    const runs: number[] = [];
    const slopes: number[] = [];
    const kept: number[] = [];
    let refused: number = 0;
    for (let i: number = 0; i < neck.length; i++) {
      const drop: number = neck[i]! - acromion[i]!;
      if (!(drop >= 0 && drop < length[i]!)) {
        refused++;
        continue;
      }
      const run: number = Math.sqrt(length[i]! ** 2 - drop ** 2);
      drops.push(drop);
      runs.push(run);
      slopes.push((Math.atan2(drop, run) * 180) / Math.PI);
      kept.push(i);
    }
    const describe = (label: string, values: number[]): string => {
      const s: HumanSurveyData.IStatistics = HumanSurveyData.statistics(values.map((v: number): number => v + 1000));
      const sorted: number[] = [...values].sort((p: number, q: number): number => p - q);
      const at = (p: number): string => sorted[Math.round(p * (sorted.length - 1))]!.toFixed(1);
      return `${label} ${(s.mean - 1000).toFixed(1)} (${s.sd.toFixed(1)}), 1st ${at(0.01)}, 99th ${at(0.99)}`;
    };
    const s: HumanSurveyData.IStatistics = HumanSurveyData.statistics(length);
    console.log(
      `ansur1988 ${sex} shoulder length ${s.mean.toFixed(1)} (${s.sd.toFixed(1)}); ${describe("drop", drops)}; ${describe("run", runs)}; ${describe("slope", slopes)} degrees; refused ${refused} of ${neck.length}`,
    );
    console.log(`  drop on shoulder length: ${HumanSurveyData.printed(HumanSurveyData.line(kept.map((i: number): number => length[i]!), drops))}`);
    console.log(`  run on biacromial breadth: ${HumanSurveyData.printed(HumanSurveyData.line(kept.map((i: number): number => biacromial[i]!), runs))}`);
  }
}
