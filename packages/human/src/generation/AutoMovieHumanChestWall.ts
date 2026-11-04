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
 * measures at the nipple line by caliper: chest depth (`che_de`) from the
 * mid-sternum to the spine and chest diameter (`che_di`) across the rib cage,
 * with the chest girth (`che_gi`) at the nipple line in men and just above the
 * breast tissue in women, so in both sexes the three describe the thorax
 * without the breasts. Derivation: the depth and the diameter, each on that
 * girth by ordinary least squares by sex ({@link LINES};
 * `test_human_survey_chest_wall`), evaluated at the underbust girth, which
 * wraps the same thorax under the breasts; the pair is then held so the girth
 * lies inside its box (`AutoMovieHumanBodyBox.place`).
 *
 * The caliper presses through the soft tissue to the bone: 84 of the 260
 * women's and 109 of the 247 men's chest girths lie above the box of their
 * own depth and diameter, so the lines give the bony thorax and the placement
 * scales both up together where the skin's girth needs it, keeping the
 * thorax's depth over diameter (0.681, SD 0.069, in women; 0.696, 0.066, in
 * men).
 *
 * Premise: the thorax keeps its depth-on-girth and breadth-on-girth law over
 * the few centimetres between the nipple line and the inframammary fold.
 */
export namespace AutoMovieHumanChestWall {
  /** One sex's two lines on the girth, `a + b girth`, mm. */
  export interface IWall {
    /** Chest depth, mid-sternum to spine: intercept, mm, and slope per mm of girth. */
    depth: { a: number; b: number };

    /** Chest diameter across the rib cage: intercept, mm, and slope per mm of girth. */
    breadth: { a: number; b: number };
  }

  /**
   * Women's and men's lines, Heinz et al. 2003, mm on mm of girth: depth R2
   * 0.38 and 0.49 (residual SD 14.5 and 15.3 mm), diameter R2 0.54 and 0.53
   * (12.4 and 14.3 mm).
   */
  export const LINES: readonly [IWall, IWall] = [
    { depth: { a: 19.97, b: 0.1828 }, breadth: { a: 74.78, b: 0.2164 } },
    { depth: { a: -2.46, b: 0.2085 }, breadth: { a: 87.04, b: 0.2104 } },
  ];

  /**
   * The chest wall's box at a girth.
   *
   * @param measures A person's resolved measures, for the sex.
   * @param girth The level's taut-tape girth, mm (the underbust girth at the fold).
   * @returns The wall's breadth and depth, mm, whose box's range holds the girth.
   */
  export function box(measures: IAutoMovieHumanBodyMeasures, girth: number): { breadth: number; depth: number } {
    const wall: IWall = LINES[measures.sex === AutoMovieHumanSex.Female ? 0 : 1];
    const placed: { breadth: number; depth: number; girth: number } = AutoMovieHumanBodyBox.place(
      { breadth: undefined, depth: undefined, girth },
      girth,
      (g: number): number => wall.breadth.a + wall.breadth.b * g,
      (g: number): number => wall.depth.a + wall.depth.b * g,
    );
    return { breadth: placed.breadth, depth: placed.depth };
  }
}
