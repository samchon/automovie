import { AutoMovieViewSection } from "@automovie/engine";

import { AutoMovieHumanSex } from "../typings/AutoMovieHumanSex";
import type { IAutoMovieHumanBodyMeasures } from "./IAutoMovieHumanBodyMeasures";

/**
 * The chest wall's box at a girth: the thorax's breadth and depth without the
 * breasts, at the underbust (ISO 8559-1 5.3.8, the inframammary fold), which
 * has a girth and no published breadth or depth. The breast's separate source
 * placement reads its own local wall; this underbust box is not its amplitude.
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
 * wraps the thorax under the breasts. This height/tissue transfer is a model
 * premise. The compressed calipers supply an aspect ratio, not a skin box:
 * their ellipse is scaled uniformly to the skin tape by the engine's section
 * length owner. No new regression or tissue thickness is fitted.
 *
 * The caliper presses through the soft tissue to the bone: 84 of the 260
 * women's and 109 of the 247 men's chest girths lie above the box of their
 * own depth and diameter. Enlarging only to the rectangular perimeter would
 * force a rectangular skin section. The ellipse convention instead keeps the
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
   * @returns Skin-template breadth and depth, mm, retaining the compressed-caliper ratio and closing the ellipse tape. This is a construction convention, not a measured skin section.
   *
   * @evidence contracts/common.md#principled-implementation Uses the retained sex-specific caliper regression only for a positive B:D prior, then the engine ellipse perimeter and its positive homogeneity to close the requested skin tape. The nipple-to-underbust and compressed-caliper-to-skin transfers remain explicit conventions.
   * @evidence contracts/common.md#clear-and-simple-design Owns this unknown underbust box only; explicit chest, waist and hip B/D stay in BodyBox. Section geometry and numerical length stay with the engine.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Adds no coefficient, reference residual or person-specific correction. Nonfinite or nonpositive tape, predictions or perimeter throw a named failure instead of returning a substitute box.
   * @evidence contracts/common.md#meaningful-documentation Gives the retained regression provenance, units, separate wall/amplitude ownership, transfer assumptions and failure conditions; it does not claim a measured skin ellipse.
   * @evidence contracts/performance.md#efficient-algorithms Evaluates two lines and one four-quarter section perimeter per call; cost is the engine's bounded numerical length evaluation, independent of a whole Human mesh.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the girth already measured by ViewSection.of to scale both dimensions, without running native quadrature twice. No repeated Human generation or mutable cache is used.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Owns only local numeric/template values and the returned two-number box; no retained cache, task or external handle is acquired.
   */
  export function box(
    measures: IAutoMovieHumanBodyMeasures,
    girth: number,
  ): { breadth: number; depth: number } {
    const wall: IWall =
      LINES[measures.sex === AutoMovieHumanSex.Female ? 0 : 1];
    const breadth: number = wall.breadth.a + wall.breadth.b * girth;
    const depth: number = wall.depth.a + wall.depth.b * girth;
    if (
      ![breadth, depth, girth].every(Number.isFinite) ||
      !(breadth > 0 && depth > 0 && girth > 0)
    )
      throw new Error(
        "Chest-wall template needs positive finite tape and compressed-caliper predictions",
      );
    const ellipse: number = AutoMovieViewSection.ELLIPSE;
    const perimeter: number = AutoMovieViewSection.of(
      { extents: [depth / 2, breadth / 2, depth / 2, breadth / 2] },
      [ellipse, ellipse, ellipse, ellipse],
    ).girth;
    if (!(Number.isFinite(perimeter) && perimeter > 0))
      throw new Error("Chest-wall ellipse has no finite positive perimeter");
    const scale: number = girth / perimeter;
    return { breadth: breadth * scale, depth: depth * scale };
  }
}
