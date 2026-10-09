import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * Complementary material regions of one skin, without duplicated area.
 *
 * @evidence contracts/common.md#principled-implementation Two named outputs distinguish the mutually exclusive material areas and their common contour.
 * @evidence contracts/common.md#clear-and-simple-design Carries only the two meshes the final material owner consumes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither output is a coincident overlay over retained source area.
 * @evidence contracts/common.md#meaningful-documentation Defines the common contour and coverage meaning for both results.
 * @author Samchon
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Names material regions rather than authoring parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no control.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Carries meshes emitted by the partition owner.
 * @evidence contracts/modeling.md#spatial-conventions Both meshes retain the original metre frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The calculation creates the common contour.
 * @evidenceExclude contracts/modeling.md#rendered-observation Final consumers observe the meshes.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no anatomy.
 * @evidenceExclude contracts/anatomy.md#permitted-range Final geometry owners admit values.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no shaping input.
 */
export interface IHumanSkinMaterialPartition {
  /** Skin outside coverage, including its shared contour vertices. */
  uncovered: IAutoMovieMesh;

  /** Skin inside coverage, including the identical contour vertices. */
  covered: IAutoMovieMesh;
}
