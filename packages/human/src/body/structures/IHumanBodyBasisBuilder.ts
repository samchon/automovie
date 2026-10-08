import type { IAutoMovieHumanBodyBasisDocument } from "./IAutoMovieHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyBuild } from "./IAutoMovieHumanBodyBuild";
import type { IHumanBodyPreparedBuild } from "./IHumanBodyPreparedBuild";

/**
 * Evaluate a complete body, or prepare its exterior for person composition.
 *
 * The callable remains the normal complete body consumer. Person composition
 * prepares the same admitted skin and pose first, forms the joined exterior,
 * then completes the anatomical assembly against that one authority.
 *
 * @evidence contracts/common.md#principled-implementation The two entry routes share skin preparation and each completes one internal source solve against its final consumer exterior.
 * @evidence contracts/common.md#clear-and-simple-design Normal callers keep the callable; composition uses the explicit prepared stage.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Both routes reach the same complete assembly owner without a hidden preliminary target solve.
 * @evidence contracts/common.md#meaningful-documentation States the existing callable and the person-only composition stage.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The existing part owners define the body.
 * @evidenceExclude contracts/modeling.md#parameter-channels The body document and its owners define controls.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The builder's existing surface and source stages emit geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Prepared and completed result owners carry the common frame.
 * @evidence contracts/modeling.md#shared-boundaries Completion consumes the complete exterior the composition formed from the prepared skin.
 * @evidenceExclude contracts/modeling.md#rendered-observation The actual body and person consumers own observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The procedure adds no anatomical value or population.
 * @evidenceExclude contracts/anatomy.md#permitted-range Existing stage owners retain admission.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The procedure adds no personal authoring field.
 *
 * @author Samchon
 */
export interface IHumanBodyBasisBuilder {
  /** Build the complete body with its own rest exterior authority. */
  (document: IAutoMovieHumanBodyBasisDocument): IAutoMovieHumanBodyBuild;

  /**
   * Complete the same construction with original layer refusal observations.
   * This explicitly inspectable result is not an accepted editor state.
   */
  construct(document: IAutoMovieHumanBodyBasisDocument): IAutoMovieHumanBodyBuild;

  /** Prepare exterior and pose so a person can determine its complete exterior first. */
  prepare(document: IAutoMovieHumanBodyBasisDocument): IHumanBodyPreparedBuild;
}
