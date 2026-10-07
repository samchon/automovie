import type { IAutoMovieHumanBodyPosedSurface } from "./IAutoMovieHumanBodyPosedSurface";
import type { IAutoMovieHumanBodyUnderwearRest } from "./IAutoMovieHumanBodyUnderwearRest";
import type { IAutoMovieHumanBodyUnderwearParts } from "./IAutoMovieHumanBodyUnderwearParts";
import type { IHumanBodyExteriorRestReference } from "../anatomy/binding/IHumanBodyExteriorRestReference";
import type { IAutoMovieHumanBodyBuild } from "./IAutoMovieHumanBodyBuild";
import type { IHumanBodySkinEvaluation } from "./IHumanBodySkinEvaluation";

/**
 * One prepared exterior and its internal assembly completion step.
 *
 * Completing consumes the prepared document and pose once against the caller's
 * chosen exterior authority. Omission uses the standalone body's rest skin;
 * a held-neutral person supplies its joined rest exterior. The completion
 * never recomputes the skin or solves a preliminary internal target.
 *
 * @evidence contracts/common.md#principled-implementation The dependency boundary lets the final consumer exterior exist before internal source targets are solved.
 * @evidence contracts/common.md#clear-and-simple-design One prepared skin record and one completion operation preserve a single document evaluation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Completion constructs all source parts instead of correcting a preliminary anatomical result.
 * @evidence contracts/common.md#meaningful-documentation States standalone omission, whole-person authority and the source target ordering.
 * @evidence contracts/modeling.md#shared-boundaries The completion consumes the exact exterior the person formed from this prepared state.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Source and exterior part owners remain unchanged.
 * @evidenceExclude contracts/modeling.md#parameter-channels The prepared document contains the already admitted controls.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The existing assembly owner constructs geometry at completion.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The exterior reference and skin evaluation own their common frame.
 * @evidenceExclude contracts/modeling.md#rendered-observation Completed consumers own observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source This transport boundary adds no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#permitted-range Existing document, pose and source target owners enforce their conditions.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Completion exposes no additional personal document field.
 *
 * @author Samchon
 */
export interface IHumanBodyPreparedBuild {
  /** Exterior and pose state available before any internal target solve. */
  skin: IHumanBodySkinEvaluation;

  /** Construct the full source assembly against its one selected exterior authority. */
  finish(reference?: IHumanBodyExteriorRestReference): IAutoMovieHumanBodyBuild;

  /**
   * Build this admitted document's garment on the consumer's final native
   * skin. Omitted rest retains the prepared shape's rest coverage reference;
   * a supplied rest uses the same native surface order in the common frame.
   * No garment choice returns undefined. The source document remains owned.
   */
  dress(
    posed: IAutoMovieHumanBodyPosedSurface[],
    rest?: IAutoMovieHumanBodyUnderwearRest,
  ): IAutoMovieHumanBodyUnderwearParts | undefined;
}
