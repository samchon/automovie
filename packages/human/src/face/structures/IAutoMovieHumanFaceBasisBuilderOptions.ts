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
 * @evidence contracts/common.md#principled-implementation Successful model observations are separately published after admission, while progress reports actual completed construction/admission boundaries including refusal. Optional occlusion/census request existing measured work without changing verdicts.
 * @evidence contracts/common.md#clear-and-simple-design Independent optional observer channels receive their actual owner's result instead of one ambiguous progress/model callback.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Progress is not timer-estimated success, absent observers fabricate no snapshots, and report-only census does not relax judged relation checks.
 * @evidence contracts/common.md#meaningful-documentation Each callback states publication, ownership and absent values; census states whole-model query cost and occlusion omission states no bake.
 * @evidenceExclude contracts/performance.md#efficient-algorithms These options execute no census, bake or publication algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Options select observation work; result copying and pose/bake reuse belong to the builder/publisher.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns callback lifetime; this schema opens no worker and publisher-created snapshots transfer to observers.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceBasisBuilderOptions {
  /**
   * Successful actual dental correspondence; omission allocates no observer snapshot.
   *
   * @evidence contracts/common.md#principled-implementation Receives only successful emission's actual dental registration, or undefined when no registration was evaluated.
   * @evidence contracts/common.md#clear-and-simple-design One optional observer separates source dental correspondence from model/contact publication.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Source registration proves no clinical crown dimensions and failed admission publishes no successful correspondence.
   * @evidence contracts/common.md#meaningful-documentation The comment states success-only delivery and omission; the parameter explicitly retains unavailable registration.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This callback signature performs no registration read or publication copy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The observer contract caches no dental result or repeated emission.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The publisher supplies an owned clone; the caller owns callback/snapshot lifetime.
   */
  observeOralMeasurements?: (
    registration: IHumanFaceOralMeasurementRegistration | undefined,
  ) => void;

  /**
   * Receive a copy of each admitted model's contact summary, or null when the
   * basis evaluates no contact.
   *
   * @evidence contracts/common.md#principled-implementation Receives the exact admitted model's contact summary and null when the basis evaluates no contact.
   * @evidence contracts/common.md#clear-and-simple-design Contact has its own observer rather than requiring a second geometry evaluation or implicit viewer lookup.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Failed admission publishes no success summary, and contact observations are not a universal anatomy or crossing certificate.
   * @evidence contracts/common.md#meaningful-documentation The comment distinguishes an owned success observation from null absence.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This signature evaluates no contact distances or publication algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The callback defines result delivery, not summary caching or repeated geometry reuse.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The publisher clones the contact summary and the caller owns its received value/callback lifetime.
   */
  observe?: (contact: IAutoMovieHumanFaceContactSummary | null) => void;

  /**
   * Receive copied IDs of the hair parts actually emitted by each admitted
   * model, including an empty array for the constructor's neutral check.
   * Failed admission publishes no IDs; certified cache hits still publish.
   *
   * @evidence contracts/common.md#principled-implementation Reports actual emitted hair IDs after this model's admission, including neutral empty population and admitted cache reuse.
   * @evidence contracts/common.md#clear-and-simple-design A readonly ID list exposes identity without retaining meshes or recomputing hair in the observer.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Requested counts or cached-but-unadmitted drafts cannot substitute for the successful emission's actual IDs.
   * @evidence contracts/common.md#meaningful-documentation The comment states neutral, failed and cached publication behavior explicitly.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The signature performs no ID census or fibre generation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work It publishes on an admitted cache hit without defining that cache's equivalence.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The publisher copies IDs for the observer; no model buffer or handle is acquired by this callback contract.
   */
  observeHairParts?: (ids: readonly string[]) => void;

  /**
   * Owned actual per-part curve/station geometry and profile gaps from this admitted emission.
   *
   * @evidence contracts/common.md#principled-implementation Reports actual admitted emission's per-part hair layouts and profile clearance, independently of requested counts or clinical follicle observations.
   * @evidence contracts/common.md#clear-and-simple-design Part-keyed layout records retain the existing layout owner's station/curve fields without another geometry representation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A requested profile or cached draft does not fabricate successful measured gaps.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies owned per-part geometry and admitted-emission scope.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This observer signature computes no station read or clearance query.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The contract defines delivery, not layout construction equivalence or caching.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The publisher clones layout maps and the observer owns them; callback lifetime stays with the builder caller.
   */
  observeHairContactLayouts?: (
    layouts: ReadonlyMap<string, IHumanFaceHairContactLayout>,
  ) => void;

  /**
   * Receive owned material skin attachments only after this model passes admission.
   *
   * @evidence contracts/common.md#principled-implementation Delivers this admitted model's exact registered material skin seats grouped by physical domain and ID.
   * @evidence contracts/common.md#clear-and-simple-design Nested readonly maps retain domain/sample identity without introducing a coordinate-fitted parallel attachment system.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Failed geometry cannot publish successful attachment witnesses, and material coordinates certify no clinical quantities.
   * @evidence contracts/common.md#meaningful-documentation The comment states success/ownership and the parameter groups physical domains, then registered material-seat point IDs assigned from exact source identities.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This callback signature performs no seat compilation or lookup.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The delivery contract defines no attachment cache or same-generation equivalence policy.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The publisher clones attachment maps and transfers the value to the observer; no host geometry handle is opened here.
   */
  observeMaterialAttachments?: (
    attachments: ReadonlyMap<
      string,
      ReadonlyMap<number, IHumanFaceMaterialAttachment>
    >,
  ) => void;

  /**
   * Receive every registered face measurement read on each admitted model's
   * final surface, with the document's target beside each, including the
   * constructor's neutral check. Failed admission publishes nothing.
   *
   * @evidence contracts/common.md#principled-implementation Receives every registered final-surface reading beside its actual target or named unavailable reason after admission, including neutral compilation.
   * @evidence contracts/common.md#clear-and-simple-design One registry-ordered reading list exposes measured/gap alternatives through their existing discriminated owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Targets never replace measured results, unavailable protocols receive no default reading and a refused build publishes no success list.
   * @evidence contracts/common.md#meaningful-documentation The comment states final-surface, target, neutral and success-only delivery semantics.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This signature runs no registry instrument or residual comparison.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The observer contract owns no measurement cache or repeated-pose coordination.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The fresh readings list is delivered to the observer and is not retained by this declaration; the caller owns callback lifetime.
   */
  observeMeasurements?: (
    readings: AutoMovieHumanFaceMeasurementReading[],
  ) => void;

  /**
   * Receive an owned snapshot of this successful build's evaluated shape-only
   * reference. Undefined means the evaluator has no reference state. A failed
   * model publishes nothing; omission avoids copying reference buffers.
   *
   * @evidence contracts/common.md#principled-implementation Exposes the successful build's actual shape-only reference, separately from performed geometry, with undefined preserving absent evaluator state.
   * @evidence contracts/common.md#clear-and-simple-design A surface-keyed readonly map carries an owned snapshot of the actual reference buffers instead of a second implicit neutral reconstruction.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A refused model publishes no successful reference and missing state is not replaced by an assumed zero/neutral buffer.
   * @evidence contracts/common.md#meaningful-documentation The comment states shape-only scope, undefined absence, success-only publication and omission's copy saving.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This callback type evaluates no reference pose or geometry copy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reference delivery establishes no pose-cache identity or reusable evaluation itself.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The publisher clones reference buffers only for a supplied observer; the receiving caller owns their lifetime.
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
   *
   * @evidence contracts/common.md#principled-implementation Actual completed owner boundaries and admission completion report execution progress independently of success-only model observers, including refused construction outcomes.
   * @evidence contracts/common.md#clear-and-simple-design A typed progress event carries owner/document identity without model access or a second work scheduler.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No timer estimates completion, a throwing stage emits no completion and observer errors propagate rather than claiming successful work.
   * @evidence contracts/common.md#meaningful-documentation The comment distinguishes execution status, refusal, fresh scalar events and callback error propagation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The signature computes no progress counters or scheduling algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each actual boundary is a distinct observation, not a deduplicated geometry result.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Fresh scalar events are caller-owned and the builder caller controls observer lifetime; no task/model handle is exposed.
   */
  observeConstructionProgress?: (
    progress: IAutoMovieHumanFaceConstructionProgress,
  ) => void;

  /** Ambient-occlusion sampling; omission bakes no occlusion texture. */
  occlusion?: IAutoMovieHumanFaceOcclusionOptions;
}
