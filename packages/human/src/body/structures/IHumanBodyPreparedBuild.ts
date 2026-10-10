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
 * @author Samchon
 */
export interface IHumanBodyPreparedBuild {
  /** Exterior and pose state available before any internal target solve. */
  skin: IHumanBodySkinEvaluation;

  /**
   * Construct the full source assembly against its selected exterior authority.
   * Default completion constructs registered layers after final root placement.
   * A person uses `defer` until its actual render skin carries joined physical
   * incidence, then completes layers through `appendHumanBodyLayers` once.
   * The separate garment defer preserves original region corner correspondence
   * until the Person's final skin placement and layer readings are complete.
   */
  finish(
    reference?: IHumanBodyExteriorRestReference,
    layers?: "defer",
    garment?: "defer",
  ): IAutoMovieHumanBodyBuild;

  /**
   * Prepare the admitted garment's rest coverage for its final skin consumer.
   * Omitted rest retains the prepared shape's rest coverage reference;
   * a supplied rest uses the same native surface order in the common frame.
   * No garment choice returns undefined. The source document remains owned.
   */
  dress(
    rest?: IAutoMovieHumanBodyUnderwearRest,
  ): IAutoMovieHumanBodyUnderwearParts | undefined;

  /** Compose the same garment on a completed, still-undressed standalone Body. */
  wear(build: IAutoMovieHumanBodyBuild): IAutoMovieHumanBodyBuild;
}
