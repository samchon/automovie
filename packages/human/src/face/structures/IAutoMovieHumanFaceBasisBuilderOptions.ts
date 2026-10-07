import type { IHumanFaceOralMeasurementRegistration } from "../anatomy/oral/IHumanFaceOralMeasurementRegistration";
import type { AutoMovieHumanFaceMeasurementReading } from "./AutoMovieHumanFaceMeasurementReading";
import type { IAutoMovieHumanFaceConstructionProgress } from "./IAutoMovieHumanFaceConstructionProgress";
import type { IAutoMovieHumanFaceContactSummary } from "./IAutoMovieHumanFaceContactSummary";
import type { IAutoMovieHumanFaceOcclusionOptions } from "./IAutoMovieHumanFaceOcclusionOptions";

/**
 * Optional observers and occlusion baking for `createHumanFaceBasisBuilder`.
 *
 * Result observers receive copies after each admitted model and never alter
 * it. The progress observer instead receives actual completed boundaries,
 * including refused construction admission, without model access.
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
   * Successful actual dental correspondence; omission allocates no observer snapshot.
   * @evidence contracts/common.md#principled-implementation Publishes compact source correspondence only after the same actual model admission, with an owned snapshot.
   * @evidence contracts/common.md#clear-and-simple-design One optional callback carries successful oral correspondence to actual-model readers.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Omission creates no observer copy and failure publishes no substitute registration.
   * @evidence contracts/common.md#meaningful-documentation States successful publication, source correspondence and omission cost.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Reports generator-owned identities without defining parts.
   * @evidenceExclude contracts/modeling.md#emitted-geometry Reports no coordinate or mesh.
   * @evidenceExclude contracts/modeling.md#parameter-channels This observation callback adds no shape input.
   * @evidenceExclude contracts/modeling.md#shared-boundaries Reports source correspondence; the oral assembler owns actual boundaries.
   * @evidenceExclude contracts/modeling.md#spatial-conventions The compact record contains identities and indices, without coordinates.
   * @evidenceExclude contracts/modeling.md#rendered-observation Final model readers and viewer consumers perform observation; this callback transports correspondence only.
   * @evidenceExclude contracts/anatomy.md#anatomical-source Supplies no anatomical measurement, default or acquisition claim.
   * @evidenceExclude contracts/anatomy.md#permitted-range Supplies no physiological range.
   * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no authoring control.
   */
  observeOralMeasurements?: (
    registration: IHumanFaceOralMeasurementRegistration | undefined,
  ) => void;
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

  /**
   * Receive every registered face measurement read on each admitted model's
   * final surface, with the document's target beside each, including the
   * constructor's neutral check. Failed admission publishes nothing.
   *
   * @evidence contracts/common.md#principled-implementation The readings are taken on the same final surface the admitted model carries.
   * @evidence contracts/common.md#clear-and-simple-design One read-only callback per observed result.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts observeMeasurements receives fresh records and cannot change admission or the emitted model.
   * @evidence contracts/common.md#meaningful-documentation States when observeMeasurements fires and what it receives.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping observeMeasurements is a callback and defines no part.
   * @evidenceExclude contracts/modeling.md#parameter-channels observeMeasurements is not a shaping channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry observeMeasurements emits no geometry; the builder does.
   * @evidenceExclude contracts/modeling.md#spatial-conventions Each reading states its own unit.
   * @evidenceExclude contracts/modeling.md#shared-boundaries observeMeasurements builds no boundary.
   * @evidenceExclude contracts/modeling.md#rendered-observation The face builder owns observation of the emitted model; observeMeasurements only reports it.
   * @evidenceExclude contracts/anatomy.md#anatomical-source Each registered measurement states its protocol.
   * @evidenceExclude contracts/anatomy.md#permitted-range observeMeasurements admits no anatomical value.
   * @evidenceExclude contracts/anatomy.md#parametric-authority observeMeasurements does not shape a person.
   */
  observeMeasurements?: (
    readings: AutoMovieHumanFaceMeasurementReading[],
  ) => void;

  /**
   * Receive an owned snapshot of this successful build's evaluated shape-only
   * reference. Undefined means the evaluator has no reference state. A failed
   * model publishes nothing; omission avoids copying reference buffers.
   *
   * @evidence contracts/common.md#principled-implementation The observer receives the exact cached pose reference through an owned copy only after model admission.
   * @evidence contracts/common.md#clear-and-simple-design One callback transports the homologous reference state to the person measurement consumer.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing source reference remains undefined rather than using neutral basis coordinates or a closure-zero performed pose.
   * @evidence contracts/common.md#meaningful-documentation States publication timing, copying and missing-state meaning.
   * @evidence contracts/modeling.md#spatial-conventions Reference arrays remain canonical head-frame metre coordinates.
   * @evidenceExclude contracts/anatomy.md#anatomical-source Transports an evaluated state without introducing anatomical values.
   * @evidenceExclude contracts/anatomy.md#permitted-range The source evaluator admits the reference.
   * @evidenceExclude contracts/anatomy.md#parametric-authority The callback defines no authoring control.
   */
  observeReference?: (
    reference: ReadonlyMap<string, readonly number[]> | undefined,
  ) => void;

  /**
   * True also evaluates the report-only assembly census in `construct`: every
   * unjudged spatial relation and the census of each part. It costs a signed
   * query per vertex of the whole model, so an interactive consumer omits it.
   * Omission changes no verdict: every judged relation is still measured,
   * reported and refused under the same conditions.
   */
  census?: boolean;

  /**
   * Receive actual geometry and admission completion for ordinary builds and
   * construction drafts. A stage that throws has no completion event. Events
   * carry fresh scalar records; an observer error propagates to its caller.
   * This is execution status and never success-only model publication.
   */
  observeConstructionProgress?: (
    progress: IAutoMovieHumanFaceConstructionProgress,
  ) => void;

  /** Ambient-occlusion sampling; omission bakes no occlusion texture. */
  occlusion?: IAutoMovieHumanFaceOcclusionOptions;
}
