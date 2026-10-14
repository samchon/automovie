import type { IAutoMovieHumanPersonDocument } from "@automovie/human";
import type { IConnectedBodyConstructionExportResult } from "@automovie/human/body/runtime/IConnectedBodyConstructionExportResult";

import type { IConnectedPersonConstructionPreview } from "./IConnectedPersonConstructionPreview";
import type { IConnectedPersonModel } from "./IConnectedPersonModel";

/**
 * Numerical preparation, qualified construction display, export and view operations used by the connected person panel.
 *
 * Preparation does not publish automatically: ordinary build rejects runtime refusal, while construct returns the full construction and admission report for labelled draft inspection. The panel alone decides current publication and accepted history.
 *
 * The mounted viewport owns its resident numerical connection and prepared/displayed frames. The actual browser factory also owns renderer, orbit and resize resources; primitive stage renderers remain borrowed. Closing one end of the page's shared worker retires the physical worker and refuses its peer transport.
 *
 * @evidence contracts/common.md#principled-implementation Separate build/construct/publication/export/retirement operations let the panel preserve numerical admission outcomes and current intent without promoting visible drafts into accepted history.
 * @evidence contracts/common.md#clear-and-simple-design One viewport contract keeps numerical/GPU owners outside panel DOM logic while browser factory and primitive stage retain their actual ownership boundaries.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Construction drafts retain admission reports and export guards, cancellation is not cleanup completion and shared-worker retirement does not leave a peer falsely live.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes ordinary refused builds from qualified construction, panel publication/history and mounted connection/browser resource ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The viewport interface chooses no numerical, encoding, scene upload or camera algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Operations declare no cached geometry equivalence or topology reuse implementation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This declaration allocates no worker or GPU handle; concrete implementations own pending requests, frames and native release.
 *
 * @author Samchon
 */
export interface IConnectedPersonViewport<Model extends IConnectedPersonModel> {
  /**
   * Prepare a document's frame with optional crossing and anatomy inspections; omitted flags are false. The caller must publish an admitted frame or retire it.
   *
   * @evidence contracts/common.md#principled-implementation Explicit inspection flags separate expensive observational readback from ordinary document preparation without changing the authored input.
   * @evidence contracts/common.md#clear-and-simple-design Prepared models return to the panel before publication, preserving its transaction authority.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Optional inspection is not represented as a fabricated successful reading when flags are absent.
   * @evidence contracts/common.md#meaningful-documentation The member identifies flag defaults, prepared-frame ownership and publication or retirement obligations.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This build signature selects no geometry or crossing algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The numerical implementation owns any resident source or topology reuse behind preparation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Prepared-frame resource lifetime belongs to the supplied viewport until explicit publication or retirement.
   */
  build(
    document: IAutoMovieHumanPersonDocument,
    measure?: boolean,
    anatomy?: boolean,
  ): Promise<Model>;

  /**
   * Prepare the numerical owner's full construction with its admission report, retaining a refused construction for explicit labelled draft inspection.
   *
   * @evidence contracts/common.md#principled-implementation Model and admission travel together so current-intent publication can distinguish accepted construction from an inspectable refused draft.
   * @evidence contracts/common.md#clear-and-simple-design The viewport prepares qualified output while the panel owns draft display, accepted history and stale result retirement.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A refused admission is not converted to accepted geometry or an invented replacement model merely because construction completed.
   * @evidence contracts/common.md#meaningful-documentation The member specifies full construction, attached admission and explicit refused-draft inspection scope.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The signature implements no construction, admission evaluation or GPU preparation algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Qualified preparation declares no reusable model identity across documents or admissions.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The returned prepared frame requires current publication or viewport-owned retirement; this type acquires none itself.
   */
  construct(
    document: IAutoMovieHumanPersonDocument,
  ): Promise<IConnectedPersonConstructionPreview<Model>>;

  /**
   * Encode explicit construction bytes with the numerical owner's admission report while retaining its ordinary export guards.
   *
   * @evidence contracts/common.md#principled-implementation Construction export preserves both GLB output and its admission outcome for the panel's separately labelled draft delivery.
   * @evidence contracts/common.md#clear-and-simple-design Numerical encoding remains in the viewport/worker while user-file handoff and accepted-history state remain panel responsibilities.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Draft export neither weakens ordinary export guards nor turns a refused admission report into accepted geometry.
   * @evidence contracts/common.md#meaningful-documentation The member identifies guarded construction bytes, attached admission and separate user delivery/history scope.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The type selects no GLB encoding, geometry traversal or admission algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Explicit construction exports declare no shared mutable output buffer or cached result identity.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Encoding tasks remain numerical-owner resources and returned bytes/report are ordinary caller data.
   */
  exportConstruction(
    document: IAutoMovieHumanPersonDocument,
  ): Promise<Pick<IConnectedBodyConstructionExportResult, "glb" | "admission">>;

  /**
   * Withdraw the pending build's publication authority; already prepared stale frames still require retirement.
   *
   * @evidence contracts/common.md#principled-implementation Cancellation withdraws a preview request while keeping the resident source available for later edits.
   * @evidence contracts/common.md#clear-and-simple-design One cancel entry hides worker correlation and generation bookkeeping from the panel.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Withdrawal is not a time-based numerical refusal or a claim of immediate worker termination.
   * @evidence contracts/common.md#meaningful-documentation The comment distinguishes pending authority from prepared-frame retirement.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This cancellation declaration chooses no request lookup or interruption strategy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Cancellation is an intent effect rather than reusable numerical work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Worker and prepared-frame ownership remain with the viewport implementation behind cancellation.
   */
  cancel(): void;

  /**
   * Display a current prepared model after the panel classifies it as accepted or an explicitly labelled construction draft.
   *
   * @evidence contracts/common.md#principled-implementation Explicit publication joins the panel's current document/admission classification with an already prepared frame.
   * @evidence contracts/common.md#clear-and-simple-design The viewport owns display replacement while the panel owns classification and accepted-history transitions.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Visibility is not an admission verdict and prepared completion alone does not authorize stale document publication.
   * @evidence contracts/common.md#meaningful-documentation The member identifies current prepared input and accepted-versus-labelled-draft publication authority.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The publication type implements no scene update, buffer reuse or material algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Concrete renderer topology/material reuse remains behind this effectful publication seam.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Displayed-frame transfer and old-frame retirement remain viewport-owned rather than performed by the type declaration.
   */
  publish(model: Model): void;

  /**
   * Request retirement of an unadmitted or temporary frame; await actual cleanup through settlement.
   *
   * @evidence contracts/common.md#principled-implementation Frames that are observed or superseded retire through the same viewport that allocated their resources.
   * @evidence contracts/common.md#clear-and-simple-design The panel disposes by model identity without traversing GPU buffers or texture caches.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A void retirement request does not certify that asynchronous disposal succeeded.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies temporary-frame retirement and its separate settlement boundary.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This disposal contract chooses no resource traversal or cache-release strategy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Disposing a frame is an ownership effect without shared numerical output.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The supplied disposer owns the frame resources whose retirement it requests.
   */
  dispose(model: Model): void;

  /**
   * Await requested resource retirement without rolling back an already published model.
   *
   * @evidence contracts/common.md#principled-implementation Cleanup settlement remains observable after publication so a failed retirement cannot silently undo an admitted document-model pair.
   * @evidence contracts/common.md#clear-and-simple-design One asynchronous boundary aggregates viewport-owned retirement without exposing internal queues.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Cleanup errors remain rejected outcomes rather than success guesses from elapsed time.
   * @evidence contracts/common.md#meaningful-documentation The member states awaited retirement and preservation of an already published model.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This settlement signature implements no cleanup scheduling algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Repeated retirement coordination belongs to the viewport's cleanup owner.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Pending retirement tasks remain viewport-owned until their actual settlement.
   */
  settleRetirements(): Promise<void>;

  /**
   * Retire owned frames, pending numerical authority and the owned resident connection. The browser factory also closes its observer/orbit/renderer; a primitive stage leaves borrowed GPU resources to their owner.
   *
   * @evidence contracts/common.md#principled-implementation One owned close joins stage/connection retirement with browser resource cleanup in the concrete factory, preserving actual failures and repeated-call completion.
   * @evidence contracts/common.md#clear-and-simple-design Numerical stage and browser resource owners keep separate acquisition/retirement responsibilities behind the returned viewport close.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Close does not leave its owned connection falsely live or treat cancellation as physical release; closing the page's shared worker end also refuses its peer transport.
   * @evidence contracts/common.md#meaningful-documentation The member identifies owned connection/frame authority, additional browser resources, borrowed primitive GPU ownership and shared-worker consequences.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This close signature chooses no retirement fan-out, request draining or native cleanup algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Repeated-close sharing is an implementation lifetime responsibility rather than numerical result reuse declared by the type.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The interface allocates no resources; actual viewport owners retain handles until their reported retirement and enclosing native lifetime boundary.
   */
  close(): Promise<void>;

  /**
   * Encode the complete person document as caller-owned static GLB bytes through the numerical owner's ordinary export guards.
   *
   * @evidence contracts/common.md#principled-implementation Ordinary export evaluates the complete person document under its numerical source and export admission guards.
   * @evidence contracts/common.md#clear-and-simple-design Returning bytes separates numerical encoding from visible frame publication and browser user-file delivery.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Successful encoding is not clinical validity and ordinary export is not silently weakened to publish a refused construction draft.
   * @evidence contracts/common.md#meaningful-documentation The member specifies complete static person GLB, caller byte ownership and ordinary guarded encoding.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The encoding type chooses no geometry traversal, buffer allocation or GLB serialization algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Separate requested exports declare no cached output bytes or shared mutable buffer identity.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returned bytes are ordinary caller data and encoder/connection lifetime remains numerical-owner responsibility.
   */
  export(
    document: IAutoMovieHumanPersonDocument,
  ): Promise<Uint8Array<ArrayBuffer>>;

  /**
   * Fit the camera to the displayed person without editing the numerical document.
   *
   * @evidence contracts/common.md#principled-implementation Camera fitting observes the displayed model's bounds independently of authored body coordinates.
   * @evidence contracts/common.md#clear-and-simple-design The panel invokes framing without needing GPU bounds or orbit matrices.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Fitting changes observation rather than resizing the body to an expected view.
   * @evidence contracts/common.md#meaningful-documentation The member separates camera effect from numerical document mutation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This fit-view signature implements no bounds or camera-distance algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Camera fitting is a view effect without declared cached numerical output.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Existing camera resources remain owned by the viewport behind this operation.
   */
  fitView(): void;

  /**
   * Turn the camera to a yaw in degrees while preserving the authored body pose.
   *
   * @evidence contracts/common.md#principled-implementation Degree-valued camera yaw selects observation direction separately from source-rig joint rotation.
   * @evidence contracts/common.md#clear-and-simple-design A scalar view hook keeps orbit implementation out of person editing controls.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Camera yaw does not substitute a rotated or reshaped person document.
   * @evidence contracts/common.md#meaningful-documentation The comment specifies yaw units and preservation of authored pose.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This camera callback selects no orbit-matrix or positioning algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work View reorientation declares no cached or shared numerical work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Camera yaw acquires no independent renderer handle or worker task.
   */
  cameraView(degrees: number): void;

  /**
   * Toggle clay inspection display without rewriting authored material parameters.
   *
   * @evidence contracts/common.md#principled-implementation Clay is an inspection override applied to display rather than the numerical model's authored finish.
   * @evidence contracts/common.md#clear-and-simple-design A boolean hook delegates material presentation to the viewport owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Structural clay display makes no beauty-material or clinical-validity claim.
   * @evidence contracts/common.md#meaningful-documentation The member identifies inspection mode and preservation of authored materials.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This clay toggle type chooses no material traversal or upload strategy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Override-material sharing belongs to the renderer rather than this callback declaration.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The renderer owns any override material and its release, not this scalar toggle.
   */
  setClay(enabled: boolean): void;

  /**
   * Toggle the viewport's inspection shadow casters without changing the numerical model.
   *
   * @evidence contracts/common.md#principled-implementation Shadow visibility is a display-state change independent of authored geometry and numerical admission.
   * @evidence contracts/common.md#clear-and-simple-design The panel controls inspection shadows through one boolean viewport operation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Shadow toggling does not repair geometry or establish the validity of anatomical contact.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies inspection casters and the unchanged numerical model.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This shadow signature chooses no caster traversal or shadow-map update algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Static shadow invalidation and reuse remain renderer implementation responsibilities.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Shadow maps stay viewport-owned and are not acquired by this toggle declaration.
   */
  setShadows(enabled: boolean): void;
}
