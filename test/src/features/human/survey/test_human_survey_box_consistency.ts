import { HumanSurveyData } from "../../internal/HumanSurveyData";

/** One level's breadth, depth and girth columns. */
interface ILevel {
  /** The level's name as the Human's box check names it. */
  name: string;

  /** Breadth column. */
  breadth: string;

  /** Depth column. */
  depth: string;

  /** Girth column. */
  girth: string;
}

/** Each survey's trunk levels with all three measures taken on the same subjects. */
const LEVELS: Readonly<Record<"ansur1988" | "ansur2", readonly ILevel[]>> = {
  ansur1988: [
    { name: "chest", breadth: "CHEST_BRTH", depth: "CHEST_DEPTH", girth: "CHEST_CIRC" },
    { name: "omphalion waist", breadth: "WAIST_BRTH_OMPHALION", depth: "WAIST_DEPTH-OMPHALION", girth: "WAIST_CIRC-OMPHALION" },
    { name: "hip", breadth: "HIP_BRTH", depth: "BUTT_DEPTH", girth: "BUTTOCK_CIRC" },
  ],
  ansur2: [
    { name: "chest", breadth: "chestbreadth", depth: "chestdepth", girth: "chestcircumference" },
    { name: "omphalion waist", breadth: "waistbreadth", depth: "waistdepth", girth: "waistcircumference" },
    { name: "hip", breadth: "hipbreadth", depth: "buttockdepth", girth: "buttockcircumference" },
  ],
};

/**
 * A reading, not a check: how real people's trunk girths sit inside the box of
 * their own breadth and depth, the range the Human's input check holds every
 * person to.
 *
 * A convex section touching all four sides of a W by D box has a taut-tape
 * perimeter from the rhombus through the four touch points, `2 sqrt(W^2 +
 * D^2)`, to the box itself, `2 (W + D)`. The reading prints, per level, how many
 * surveyed people fall outside that range and where inside it they fall (the
 * fullness `(G - rhombus) / (box - rhombus)`), so the check's strictness is
 * judged on real bodies: the chest breadth is a caliper breadth with tissue
 * compressed, and the hip breadth and buttock depth stand at different levels.
 *
 * Scenarios:
 * 1. For each survey, sex and level (chest; omphalion waist; hip breadth with buttock depth and girth), prints the subjects below the rhombus and above the box, and the fullness's mean, SD and 1st and 99th percentiles.
 *
 * @evidence contracts/testing.md#behavioral-verification Fetches the four public files into memory (`HumanSurveyData.load`) and evaluates the two bounds per subject; prints only. It writes no file and keeps no subject row.
 * @evidence contracts/testing.md#independent-expectations No expectation: a reading kept in its own removable file that no real test imports.
 * @evidence contracts/testing.md#distinguishing-cases Both sexes of both surveys at every level where a survey takes all three measures on the same people.
 * @evidence contracts/testing.md#execution-ownership An asynchronous unit reached by `--include human_survey_box_consistency`; it needs the network to reach the public files and is part of no acceptance.
 */
export async function test_human_survey_box_consistency(): Promise<void> {
  for (const survey of ["ansur1988", "ansur2"] as const)
    for (const sex of ["female", "male"] as const) {
      const sample: HumanSurveyData.Sample = await HumanSurveyData.load(survey, sex);
      for (const level of LEVELS[survey]) {
        const w: Float64Array = HumanSurveyData.column(sample, level.breadth);
        const d: Float64Array = HumanSurveyData.column(sample, level.depth);
        const g: Float64Array = HumanSurveyData.column(sample, level.girth);
        const fullness: number[] = [];
        let below: number = 0;
        let above: number = 0;
        for (let i: number = 0; i < g.length; i++) {
          if (!(w[i]! > 0 && d[i]! > 0 && g[i]! > 0)) continue;
          const rhombus: number = 2 * Math.hypot(w[i]!, d[i]!);
          const box: number = 2 * (w[i]! + d[i]!);
          if (g[i]! < rhombus) below++;
          if (g[i]! > box) above++;
          fullness.push((g[i]! - rhombus) / (box - rhombus));
        }
        fullness.sort((p: number, q: number): number => p - q);
        const mean: number = fullness.reduce((sum: number, t: number): number => sum + t, 0) / fullness.length;
        const sd: number = Math.sqrt(fullness.reduce((sum: number, t: number): number => sum + (t - mean) ** 2, 0) / (fullness.length - 1));
        const at = (p: number): string => fullness[Math.round(p * (fullness.length - 1))]!.toFixed(3);
        console.log(
          `${survey} ${sex} ${level.name}: below the rhombus ${below}, above the box ${above} of ${fullness.length}; fullness ${mean.toFixed(3)} (${sd.toFixed(3)}), 1st ${at(0.01)}, 99th ${at(0.99)}`,
        );
      }
    }
}
