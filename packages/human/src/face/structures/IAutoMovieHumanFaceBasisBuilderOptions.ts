import type { IAutoMovieHumanFaceContactSummary } from "./IAutoMovieHumanFaceContactSummary";
import type { IAutoMovieHumanFaceOcclusionOptions } from "./IAutoMovieHumanFaceOcclusionOptions";

/**
 * Optional observers and occlusion baking for `createHumanFaceBasisBuilder`.
 *
 * Observers receive copies after each admitted model and never alter it.
 * Omitting `occlusion` leaves materials without a baked occlusion texture.
 *
 * @evidence contracts/common.md#principled-implementation Observers read the builder's admitted results and the occlusion options pass to the baker unchanged.
 * @evidence contracts/common.md#clear-and-simple-design One named record replaces the builder's anonymous options type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No observer can change admission or emitted geometry.
 * @evidence contracts/common.md#meaningful-documentation States when each observer fires, what it receives and what omission means.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The options define no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The options are not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The builder emits geometry; observers only read it.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The options carry no coordinate.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The options build no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The face builder owns observation of the emitted model.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The options carry no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The options admit no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The options do not shape a person.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceBasisBuilderOptions {
  /**
   * Receive a copy of each admitted model's contact summary, or null when the
   * basis evaluates no contact.
   *
   * @evidence contracts/common.md#principled-implementation The summary is the one the admitted build measured, copied after admission.
   * @evidence contracts/common.md#clear-and-simple-design One read-only callback per observed result.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts observe receives a copy and cannot change admission or the emitted model.
   * @evidence contracts/common.md#meaningful-documentation States when observe fires and what it receives.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping observe is a callback and defines no part.
   * @evidenceExclude contracts/modeling.md#parameter-channels observe is not a shaping channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry observe emits no geometry; the builder does.
   * @evidenceExclude contracts/modeling.md#spatial-conventions observe receives no coordinate of its own.
   * @evidenceExclude contracts/modeling.md#shared-boundaries observe builds no boundary.
   * @evidenceExclude contracts/modeling.md#rendered-observation The face builder owns observation of the emitted model; observe only reports it.
   * @evidenceExclude contracts/anatomy.md#anatomical-source observe carries no anatomical value.
   * @evidenceExclude contracts/anatomy.md#permitted-range observe admits no anatomical value.
   * @evidenceExclude contracts/anatomy.md#parametric-authority observe does not shape a person.
   */
  observe?: (contact: IAutoMovieHumanFaceContactSummary | null) => void;

  /**
   * Receive copied IDs of the hair parts actually emitted by each admitted
   * model, including an empty array for the constructor's neutral check.
   * Failed admission publishes no IDs; certified cache hits still publish.
   *
   * @evidence contracts/common.md#principled-implementation The IDs are those of the hair parts the admitted model actually contains.
   * @evidence contracts/common.md#clear-and-simple-design One read-only callback per observed result.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts observeHairParts receives a copy and cannot change admission or the emitted model.
   * @evidence contracts/common.md#meaningful-documentation States when observeHairParts fires and what it receives.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping observeHairParts is a callback and defines no part.
   * @evidenceExclude contracts/modeling.md#parameter-channels observeHairParts is not a shaping channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry observeHairParts emits no geometry; the builder does.
   * @evidenceExclude contracts/modeling.md#spatial-conventions observeHairParts receives no coordinate of its own.
   * @evidenceExclude contracts/modeling.md#shared-boundaries observeHairParts builds no boundary.
   * @evidenceExclude contracts/modeling.md#rendered-observation The face builder owns observation of the emitted model; observeHairParts only reports it.
   * @evidenceExclude contracts/anatomy.md#anatomical-source observeHairParts carries no anatomical value.
   * @evidenceExclude contracts/anatomy.md#permitted-range observeHairParts admits no anatomical value.
   * @evidenceExclude contracts/anatomy.md#parametric-authority observeHairParts does not shape a person.
   */
  observeHairParts?: (ids: readonly string[]) => void;

  /** Ambient-occlusion sampling; omission bakes no occlusion texture. */
  occlusion?: IAutoMovieHumanFaceOcclusionOptions;
}
