import type { IHumanFaceOralMeasurementRegistration } from "../anatomy/oral/IHumanFaceOralMeasurementRegistration";
import type { IHumanFaceHairContactLayout } from "../anatomy/hair/IHumanFaceHairContactLayout";
import type { IHumanFaceMaterialAttachment } from "./IHumanFaceMaterialAttachment";
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
 * @author Samchon
 */
export interface IAutoMovieHumanFaceBasisBuilderOptions {
  /**
   * Successful actual dental correspondence; omission allocates no observer snapshot.
   */
  observeOralMeasurements?: (
    registration: IHumanFaceOralMeasurementRegistration | undefined,
  ) => void;
  /**
   * Receive a copy of each admitted model's contact summary, or null when the
   * basis evaluates no contact.
   */
  observe?: (contact: IAutoMovieHumanFaceContactSummary | null) => void;

  /**
   * Receive copied IDs of the hair parts actually emitted by each admitted
   * model, including an empty array for the constructor's neutral check.
   * Failed admission publishes no IDs; certified cache hits still publish.
   */
  observeHairParts?: (ids: readonly string[]) => void;

  /**
   * Owned actual per-part curve/station geometry and profile gaps from this admitted emission.
   */
  observeHairContactLayouts?: (layouts: ReadonlyMap<string, IHumanFaceHairContactLayout>) => void;

  /**
   * Receive owned material skin attachments only after this model passes admission.
   */
  observeMaterialAttachments?: (
    attachments: ReadonlyMap<string, ReadonlyMap<number, IHumanFaceMaterialAttachment>>,
  ) => void;

  /**
   * Receive every registered face measurement read on each admitted model's
   * final surface, with the document's target beside each, including the
   * constructor's neutral check. Failed admission publishes nothing.
   */
  observeMeasurements?: (
    readings: AutoMovieHumanFaceMeasurementReading[],
  ) => void;

  /**
   * Receive an owned snapshot of this successful build's evaluated shape-only
   * reference. Undefined means the evaluator has no reference state. A failed
   * model publishes nothing; omission avoids copying reference buffers.
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
