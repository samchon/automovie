import type { IHumanBodyConstructionProgress } from "../../body/structures/IHumanBodyConstructionProgress";
import type { AutoMovieHumanFaceMeasurementReading } from "../../face/structures/AutoMovieHumanFaceMeasurementReading";
import type { IAutoMovieHumanFaceConstructionProgress } from "../../face/structures/IAutoMovieHumanFaceConstructionProgress";
import type { IAutoMovieHumanFaceOcclusionOptions } from "../../face/structures/IAutoMovieHumanFaceOcclusionOptions";
import type { AutoMovieHumanPersonConstructionStage } from "./AutoMovieHumanPersonConstructionStage";
import type { IAutoMovieHumanPersonGeneration } from "./IAutoMovieHumanPersonGeneration";
import type { IHumanPersonHairContactProps } from "./IHumanPersonHairContactProps";

/**
 * Registered one-skin evaluator source context with optional face occlusion/report-only census and actual measurement/contact/stage observers. Loaded generation stays unchanged during compiled lifetime. Omitted observers add no observation work; supplied callbacks remain effectful and their exceptions propagate. Hair receives a detached frozen pre-contact snapshot, while face readout requires resident model validation and accepted face admission but can precede a later ordinary refusal for rejected body layers. Reports establish neither clinical acceptance nor current healthy Human rendering.
 *
 * @evidence contracts/common.md#principled-implementation Actual source generation and owner-specific optional policy/observer seams preserve the shared person geometry and unchanged admission owners.
 * @evidence contracts/common.md#clear-and-simple-design Canonical generation/occlusion schemas and distinct observation callbacks separate geometry controls from source diagnostics and progress delivery.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Census changes reporting rather than judged conditions, snapshots/readouts are not final combined acceptance, and observer side effects cannot be claimed harmless or isolated.
 * @evidence contracts/common.md#meaningful-documentation Prose states unchanged source lifetime, neutral omissions, exact observer timing and face-only versus combined admission boundaries.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This input schema performs no compiler, bake, census or observation copy; actual owner implementations execute those costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Compiled context or observational reuse is concrete builder behavior rather than memoization implemented by this record.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Declaring callbacks acquires no source stream, worker or renderer; actual builder/caller observers own context and retained observation lifetimes.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonGenerationBuilderProps {
  /** The source generation, read as one skin with a head/body partition. */
  generation: IAutoMovieHumanPersonGeneration;

  /** The face producer's occlusion bake, or none. */
  occlusion?: IAutoMovieHumanFaceOcclusionOptions;

  /**
   * Receive actual final resident-model face measurements in the inverse head frame at Float32 export precision when face admission is accepted. Internal normal-reference calls do not publish readouts; omission adds no reader. Body-layer rejection can still make the ordinary result refuse after this readout, so delivery is not final person acceptance. Acquisition gaps/source qualifications remain in observations; callback effects/errors propagate.
   *
   * @evidence contracts/common.md#principled-implementation Same-evaluation final model/source-region correspondence supplies actual observational face protocols rather than a separately evaluated proxy.
   * @evidence contracts/common.md#clear-and-simple-design One readout callback exposes canonical registry results while person acquisition/instruments and combined admission remain separate owners.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Face-accepted/resident readout is not claimed body-layer/person acceptance or clinical/GPU certification, and unavailable acquisitions remain explicit.
   * @evidence contracts/common.md#meaningful-documentation Prose states Float32 inverse frame, face-only guard, internal-reference omission, later refusal and effectful delivery.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This erased callback runs no acquisition or instrument traversal; actual reader/observer implementations own those costs.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Sharing one final geometry across instruments is reader behavior rather than a cache in this observer signature.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The signature acquires no measurement task; actual observers own any retained result arrays and external side effects.
   */
  observeFaceMeasurements?: (
    readings: readonly AutoMovieHumanFaceMeasurementReading[],
  ) => void;

  /**
   * Observe detached deeply frozen actual placed hair/body/layout data before body contact, when generated hair exists. Omission allocates no snapshot. Later contact/geometry/resident/combined admission can still refuse; independently captured external callback state is outside snapshot isolation and errors propagate.
   *
   * @evidence contracts/common.md#principled-implementation Actual emitted hair station/layout and performed body fields form the pre-contact snapshot delivered by the contact wrapper.
   * @evidence contracts/common.md#clear-and-simple-design Observation copies remain separate from mutable solver operands and final construction/contact judgment.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A frozen observed copy does not prove successful later contact or isolate independently captured external side effects.
   * @evidence contracts/common.md#meaningful-documentation Prose states generated-hair timing, detached/deep freeze, omission and later failure/error boundaries.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This erased observer declaration performs no snapshot copy or body-contact solve; the wrapper/actual observer own those operations.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Delivery of one actual pre-contact snapshot is producer behavior rather than cached work in this signature.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The signature acquires no contact query or task; concrete observers own retained snapshot/external effect lifetime.
   */
  observeHairContact?: (snapshot: IHumanPersonHairContactProps) => void;

  /**
   * True requests the face producer's report-only unjudged-relation/part census during construct. It adds actual work without altering judged conditions; omission/false retain ordinary judged reporting.
   */
  census?: boolean;

  /**
   * Receive actual synchronous owner completion labels. Omission reports nothing; labels change no numerical rule, but effectful observer errors can stop construction. model-validated precedes optional measurement delivery and final combined acceptance.
   *
   * @evidence contracts/common.md#principled-implementation Closed stage identities relay actual completed body/face/skin/resident boundaries without simulated execution percentages.
   * @evidence contracts/common.md#clear-and-simple-design This label observer is separate from geometry results and admission records; the builder owns delivery order.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A progress label does not guarantee later callbacks, combined/clinical acceptance or current worker/GPU health.
   * @evidence contracts/common.md#meaningful-documentation Prose states synchronous timing, model-validation boundary and neutral omission/effectful failure distinction.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This erased callback performs no construction or progress delivery; concrete producer/observer code owns that work.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Relaying actual stages is producer behavior rather than deduplication/caching implemented by this signature.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The signature acquires no event buffer or task; actual observers own retained labels and effect lifetime.
   */
  observeStage?: (stage: AutoMovieHumanPersonConstructionStage) => void;

  /**
   * Forward actual face geometry/admission completion records with original document, basis and condition identities, including constructor bootstrap and normal-reference calls. Omission adds no reporting; observer effects/errors propagate while numerical rules stay unchanged.
   *
   * @evidence contracts/common.md#principled-implementation Exact face-owner completion identities distinguish current production, bootstrap and internal reference evaluation without fabricated stages.
   * @evidence contracts/common.md#clear-and-simple-design Canonical face progress records keep timing/condition ownership with the face producer while the person observer only relays them.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Reference/bootstrap progress is not called a successful person or current visual result, and callback exceptions remain observable.
   * @evidence contracts/common.md#meaningful-documentation Prose states actual identity preservation, internal call populations, omission and effectful delivery.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This erased function property performs no face evaluation or relay; concrete owners pay their actual completion work.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reusing canonical progress records is producer behavior rather than event caching in this callback type.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The signature acquires no face task or event subscription; actual builder/observer owns retained callbacks and observations.
   */
  observeFaceConstructionProgress?: (
    progress: IAutoMovieHumanFaceConstructionProgress,
  ) => void;

  /**
   * Forward actual body/source-owner completion records unchanged, including constructor stages and actual quantity reads. Numerical body rules remain owner-controlled; observer side effects/errors propagate and a completion is not final person acceptance.
   *
   * @evidence contracts/common.md#principled-implementation Actual body/source progress identities preserve completed preparation and quantity owner boundaries used by person composition.
   * @evidence contracts/common.md#clear-and-simple-design Canonical body progress records remain separate from person stages and geometry/admission output.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Body completion does not fabricate a whole-person or clinical/GPU verdict, and observer failure is not silently suppressed.
   * @evidence contracts/common.md#meaningful-documentation Prose states constructor/quantity populations, unchanged owner rules and effectful delivery boundaries.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This erased callback runs no body/source computation or progress relay; actual producers/observers execute those operations.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Forwarding actual source completions is implementation behavior rather than caching in the signature.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration acquires no body task or buffer; concrete builder/caller observers control callback and event lifetime.
   */
  observeBodyConstructionProgress?: (
    progress: IHumanBodyConstructionProgress,
  ) => void;
}
