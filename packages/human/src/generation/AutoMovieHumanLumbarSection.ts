import { AutoMovieHumanSex } from "../typings/AutoMovieHumanSex";
import { AutoMovieHumanBodyBox } from "./AutoMovieHumanBodyBox";
import { AutoMovieHumanBodyBreadths } from "./AutoMovieHumanBodyBreadths";
import type { IAutoMovieHumanBodyMeasures } from "./IAutoMovieHumanBodyMeasures";

/**
 * The lumbar section's box at a girth: the breadth and depth of the trunk at
 * a level between the natural waist and the hip that has a girth and no
 * published breadth or depth, such as ISO 8559-1 5.3.12's top hip level and
 * iliocristale.
 *
 * Source: the navel section, the one lumbar level where a survey takes a
 * breadth and a depth with the girth: ANSUR 1988's waist breadth and depth at
 * omphalion, each on the omphalion girth by ordinary least squares by sex
 * (`AutoMovieHumanBodyBreadths.WAIST_BREADTH_ON_WAIST`, `WAIST_DEPTH_ON_WAIST`;
 * R2 0.85 to 0.92; `test_human_survey_waist_section`). Omphalion lies between
 * the natural waist and the top hip level of every surveyed adult (ANSUR II
 * omphalion at 0.6017 and 0.6014 of stature, `docs/sources/ansur-ii-trunk-ratios.md`).
 * Derivation: the two lines evaluated at the level's own girth, then held so
 * the girth lies inside their box (`AutoMovieHumanBodyBox.place`), premised
 * on the lumbar section keeping the navel section's law over the levels it
 * serves. The natural waist's default breadth and depth are the same law.
 */
export namespace AutoMovieHumanLumbarSection {
  /**
   * The box of a lumbar level at its girth.
   *
   * @param measures A person's resolved measures, for the sex.
   * @param girth The level's taut-tape girth, mm.
   * @returns The level's breadth and depth, mm, whose box's range holds the girth.
   */
  export function box(measures: IAutoMovieHumanBodyMeasures, girth: number): { breadth: number; depth: number } {
    const k: 0 | 1 = measures.sex === AutoMovieHumanSex.Female ? 0 : 1;
    const breadth: AutoMovieHumanBodyBreadths.ILine = AutoMovieHumanBodyBreadths.WAIST_BREADTH_ON_WAIST[k];
    const depth: AutoMovieHumanBodyBreadths.ILine = AutoMovieHumanBodyBreadths.WAIST_DEPTH_ON_WAIST[k];
    const placed: { breadth: number; depth: number; girth: number } = AutoMovieHumanBodyBox.place(
      { breadth: undefined, depth: undefined, girth },
      girth,
      (g: number): number => breadth.a + breadth.b * g,
      (g: number): number => depth.a + depth.b * g,
    );
    return { breadth: placed.breadth, depth: placed.depth };
  }
}
