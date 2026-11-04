import { AutoMovieHumanSex } from "../typings/AutoMovieHumanSex";
import { AutoMovieHumanBodyBox } from "./AutoMovieHumanBodyBox";
import type { IAutoMovieHumanBodyMeasures } from "./IAutoMovieHumanBodyMeasures";

/**
 * The chest wall's box at a girth: the thorax's breadth and depth without the
 * breasts, at the underbust (ISO 8559-1 5.3.8, the inframammary fold), which
 * has a girth and no published breadth or depth. The breast's amplitude is
 * the chest depth less this depth.
 *
 * Source: Heinz et al. 2003 (J Stat Educ 11(2), 260 women and 247 men,
 * `docs/sources/heinz-2003-body-dimensions.md`) take the rib cage's own
 * measures at the nipple line by caliper: chest depth from the mid-sternum to
 * the spine and chest diameter across the rib cage, with the chest girth at
 * the nipple line in men and just above the breast tissue in women, so in
 * both sexes the three describe the thorax without the breasts. Derivation:
 * the depth and the diameter, each on that girth by ordinary least squares by
 * sex (`test_human_survey_chest_wall`), evaluated at the underbust girth,
 * which wraps the same thorax under the breasts; the pair is then held so the
 * girth lies inside its box (`AutoMovieHumanBodyBox.place`).
 *
 * Premise: the thorax keeps its depth-on-girth and breadth-on-girth law over
 * the few centimetres between the nipple line and the inframammary fold.
 *
 * Pending: the two lines' coefficients come from the survey reading, which
 * waits for the owner's test window; until then each sex's entry of {@link LINES} is empty and
 * {@link box} reports it rather than inventing a value.
 */
export namespace AutoMovieHumanChestWall {
  /** One sex's two lines on the girth, `a + b girth`, mm. */
  export interface IWall {
    /** Chest depth, mid-sternum to spine: intercept, mm, and slope per mm of girth. */
    depth: { a: number; b: number };

    /** Chest diameter across the rib cage: intercept, mm, and slope per mm of girth. */
    breadth: { a: number; b: number };
  }

  /** Women's and men's lines, Heinz et al. 2003; empty until the survey reading runs. */
  export const LINES: readonly [IWall | undefined, IWall | undefined] = [undefined, undefined];

  /**
   * The chest wall's box at a girth.
   *
   * @param measures A person's resolved measures, for the sex.
   * @param girth The level's taut-tape girth, mm (the underbust girth at the fold).
   * @returns The wall's breadth and depth, mm, whose box's range holds the girth.
   * @throws While the sex's entry of {@link LINES} waits on its survey reading.
   */
  export function box(measures: IAutoMovieHumanBodyMeasures, girth: number): { breadth: number; depth: number } {
    const wall: IWall | undefined = LINES[measures.sex === AutoMovieHumanSex.Female ? 0 : 1];
    if (wall === undefined)
      throw new Error("AutoMovieHumanChestWall: the chest wall's lines wait on test_human_survey_chest_wall (Heinz et al. 2003)");
    const placed: { breadth: number; depth: number; girth: number } = AutoMovieHumanBodyBox.place(
      { breadth: undefined, depth: undefined, girth },
      girth,
      (g: number): number => wall.breadth.a + wall.breadth.b * g,
      (g: number): number => wall.depth.a + wall.depth.b * g,
    );
    return { breadth: placed.breadth, depth: placed.depth };
  }
}
