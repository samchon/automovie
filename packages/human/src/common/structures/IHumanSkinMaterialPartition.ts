import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * Complementary material regions of one skin, without duplicated area.
 *
 * @author Samchon
 */
export interface IHumanSkinMaterialPartition {
  /** Skin outside coverage, including its shared contour vertices. */
  uncovered: IAutoMovieMesh;

  /** Skin inside coverage, including the identical contour vertices. */
  covered: IAutoMovieMesh;
}
