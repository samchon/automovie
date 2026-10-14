import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * Complementary material regions of one skin, without duplicated area.
 *
 *
 * @evidence contracts/common.md#principled-implementation Uncovered and covered meshes partition the same skin with identical shared contour vertices and no duplicated area.
 * @evidence contracts/common.md#clear-and-simple-design The partition result names its two complementary regions without assigning a clothing lift or a new anatomy owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Coverage splitting alone introduces no garment thickness; applyHumanBodyUnderwearMaterial owns the later covered-region displacement.
 * @evidence contracts/common.md#meaningful-documentation The interface describes complementary regions and members explicitly retain the shared contour on both sides.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Complementary skin-material partition result is erased by TypeScript; its runtime consumer owns the actual geometry or measurement traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Complementary skin-material partition result specifies caller data and performs no runtime recomputation or cache lookup.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Complementary skin-material partition result acquires no runtime handle or retained cache; concrete array and map ownership belongs to its producing and consuming functions.
 *
 * @author Samchon
 */
export interface IHumanSkinMaterialPartition {
  /** Skin outside coverage, including its shared contour vertices. */
  uncovered: IAutoMovieMesh;

  /** Skin inside coverage, including the identical contour vertices. */
  covered: IAutoMovieMesh;
}
