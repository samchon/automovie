import { AutoMovieHumanBodyBox } from "./AutoMovieHumanBodyBox";
import { AutoMovieHumanBodyBreadths } from "./AutoMovieHumanBodyBreadths";
import type { IAutoMovieHumanBodyMeasures } from "./IAutoMovieHumanBodyMeasures";

/**
 * The lumbar section's box at a girth: the breadth and depth of the trunk at
 * a level between the natural waist and the hip that has a girth and no
 * published breadth or depth, such as ISO 8559-1 5.3.12's top hip level and
 * iliocristale.
 *
 * Source: the navel section, the one lumbar level where the surveys take a
 * breadth and a depth with the girth (ANSUR II waist breadth and depth at
 * omphalion; its omphalion height share, 0.6017 and 0.6014 of stature, lies
 * between the natural waist and the top hip level of every surveyed adult,
 * `docs/sources/ansur-ii-trunk-ratios.md`). The person's navel-section
 * breadth and depth (`AutoMovieHumanBodyBreadths`, ANSUR II model B on
 * stature, BMI and age) are scaled together, keeping their proportion, into
 * the range of the level's own girth (`AutoMovieHumanBodyBox.place`), so the
 * level's girth lies inside its box.
 *
 * Derivation's premise: the lumbar section keeps the navel section's depth
 * over breadth over the levels it serves; a girth inside the navel box's range
 * keeps the navel breadth and depth unchanged. Pending: the navel section's
 * own breadth-on-girth and depth-on-girth lines (ANSUR 1988,
 * `test_human_survey_waist_section`), which replace model B when the survey
 * readings run.
 */
export namespace AutoMovieHumanLumbarSection {
  /**
   * The box of a lumbar level at its girth.
   *
   * @param measures A person's resolved measures.
   * @param girth The level's taut-tape girth, mm.
   * @returns The level's breadth and depth, mm, whose box's range holds the girth.
   */
  export function box(measures: IAutoMovieHumanBodyMeasures, girth: number): { breadth: number; depth: number } {
    const breadth: number = AutoMovieHumanBodyBreadths.model("waistBreadth", measures.sex, measures.stature, measures.bodyFatPercentage);
    const depth: number = AutoMovieHumanBodyBreadths.model("waistDepth", measures.sex, measures.stature, measures.bodyFatPercentage);
    const placed: { breadth: number; depth: number; girth: number } = AutoMovieHumanBodyBox.place(
      { breadth: undefined, depth: undefined, girth },
      girth,
      (): number => breadth,
      (): number => depth,
    );
    return { breadth: placed.breadth, depth: placed.depth };
  }
}
