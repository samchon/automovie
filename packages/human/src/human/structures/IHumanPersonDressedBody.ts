import type { IAutoMovieHumanBodyBuild } from "../../body/structures/IAutoMovieHumanBodyBuild";
import type { IAutoMovieHumanBodyUnderwearParts } from "../../body/structures/IAutoMovieHumanBodyUnderwearParts";

/**
 * Body source parts retained until Person's final shared-skin material split.
 * The internal recipe stays outside the public serializable Body build record.
 * @evidence contracts/common.md#principled-implementation Separate fields keep the recipe outside the public serializable Body DTO.
 * @evidence contracts/common.md#clear-and-simple-design Names the Body and internal garment recipe separately.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No recipe Map is added to a public Body record.
 * @evidence contracts/common.md#meaningful-documentation States retained corner order and serialization boundary.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Final producers name parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels Prepared document defines controls.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Carries records without emission.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Performs no transform.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Final partition defines the contour.
 * @evidenceExclude contracts/modeling.md#rendered-observation Final consumers observe output.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#permitted-range Existing source owners admit geometry.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no control.
 * @author Samchon
 */
export interface IHumanPersonDressedBody {
  /** Body record with its original source geometry and registered fabric material. */
  body: IAutoMovieHumanBodyBuild;

  /** Rest-material garment recipe; absent when the document wears none. */
  garment?: IAutoMovieHumanBodyUnderwearParts;
}
