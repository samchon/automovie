import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human";

/**
 * The numerical viewport the connected body panel drives: builds, publishes and exports body documents, owns camera and display state, and may solve the arms-down preset. Builds prepare frames before document admission; disposal requests their retirement and settlement reports cleanup failures. The mounted viewport owns its numerical connection. Browser mounts additionally own the renderer, orbit controls and resize subscription released by close.
 *
 * @evidence contracts/common.md#principled-implementation Preparation and publication are separate so the panel can admit a document before replacing the display, while explicit retirement preserves cleanup outcomes for stale or failed frames.
 * @evidence contracts/common.md#clear-and-simple-design The panel receives frame lifecycle, export, view controls and an optional numerical preset solver without importing GPU implementation or managing individual renderer resources.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Inspection flags request actual numerical readback, and a successful build does not by itself establish clinical validity or an admitted document.
 * @evidence contracts/common.md#meaningful-documentation The interface describes preparation, publication, asynchronous retirement, numerical-connection ownership and additional resources owned by browser mounts.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This viewport schema chooses no numerical build, export or display algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The contract exposes operations without implementing topology reuse or cached numerical evaluation across documents.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The schema states ownership boundaries but allocates no GPU handles or worker; viewport implementations acquire and retire them.
 *
 * @author Samchon
 */
export interface IConnectedBodyViewport<Model> {
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
  build: (
    document: IAutoMovieHumanBodyBasisDocument,
    measure?: boolean,
    anatomy?: boolean,
  ) => Promise<Model>;

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
  cancel: () => void;

  /**
   * Display a prepared model after the body document transaction admits it.
   *
   * @evidence contracts/common.md#principled-implementation Synchronous publication joins a prepared frame to the panel's admitted document state.
   * @evidence contracts/common.md#clear-and-simple-design Publication accepts an existing model without repeating numerical document preparation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Preparation completion alone does not bypass the caller's document admission before display.
   * @evidence contracts/common.md#meaningful-documentation The member places display after body-document transaction admission.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This publication signature implements no buffer-update or topology-reuse algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Renderer buffer sharing is a supplied implementation responsibility, not declared by this callback type.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Displayed frame transfer and previous-frame retirement remain viewport-owned.
   */
  publish: (model: Model) => void;

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
  dispose: (model: Model) => void;

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
  settleRetirements: () => Promise<void>;

  /**
   * Retire viewport-owned frames and its numerical connection. A browser mount also releases the renderer, controls and observer it acquired; a stage preserves borrowed GPU services.
   *
   * @evidence contracts/common.md#principled-implementation Final closure follows acquisition ownership, ending the resident connection and stage state before a browser mount releases its own host services.
   * @evidence contracts/common.md#clear-and-simple-design One close completion lets the mounting page retire the viewport without duplicating renderer or worker internals.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Closure does not terminate another owner's borrowed GPU service or hide resource-release failures.
   * @evidence contracts/common.md#meaningful-documentation The comment distinguishes stage ownership from browser acquisition and names the numerical connection's termination.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This close declaration chooses no frame or resource-retirement traversal.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Idempotent shutdown coordination is implemented by the viewport owner rather than this callable type.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This type exposes the final lifetime boundary while the stage and browser factory own acquired resources.
   */
  close: () => Promise<void>;

  /**
   * Export the body document as caller-owned GLB bytes; display-only companion geometry is excluded.
   *
   * @evidence contracts/common.md#principled-implementation Body export is evaluated from its explicit document rather than captured from a scene containing a display-only companion.
   * @evidence contracts/common.md#clear-and-simple-design Encoded bytes return separately from frame publication and user-file delivery.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Export does not add the companion head or certify clinical validity from successful encoding.
   * @evidence contracts/common.md#meaningful-documentation The member identifies document-based body export, GLB format and caller byte ownership.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This export signature selects no numerical build or serialization algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The contract promises no shared byte identity across distinct export requests.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returned bytes become caller data while the numerical connection remains viewport-owned.
   */
  export: (
    document: IAutoMovieHumanBodyBasisDocument,
  ) => Promise<Uint8Array<ArrayBuffer>>;

  /**
   * Fit the camera to the displayed body without editing the numerical document.
   *
   * @evidence contracts/common.md#principled-implementation Camera fitting observes the displayed model's bounds independently of authored body coordinates.
   * @evidence contracts/common.md#clear-and-simple-design The panel invokes framing without needing GPU bounds or orbit matrices.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Fitting changes observation rather than resizing the body to an expected view.
   * @evidence contracts/common.md#meaningful-documentation The member separates camera effect from numerical document mutation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This fit-view signature implements no bounds or camera-distance algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Camera fitting is a view effect without declared cached numerical output.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Existing camera resources remain owned by the viewport behind this operation.
   */
  fitView: () => void;

  /**
   * Turn the camera to a yaw in degrees while preserving the authored body pose.
   *
   * @evidence contracts/common.md#principled-implementation Degree-valued camera yaw selects observation direction separately from source-rig joint rotation.
   * @evidence contracts/common.md#clear-and-simple-design A scalar view hook keeps orbit implementation out of body editing controls.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Camera yaw does not substitute a rotated or reshaped body document.
   * @evidence contracts/common.md#meaningful-documentation The comment specifies yaw units and preservation of authored pose.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This camera callback selects no orbit-matrix or positioning algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work View reorientation declares no cached or shared numerical work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Camera yaw acquires no independent renderer handle or worker task.
   */
  cameraView: (degrees: number) => void;

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
  setClay: (enabled: boolean) => void;

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
  setShadows: (enabled: boolean) => void;

  /**
   * Optionally solve arms-down joint and shoulder rows on the supplied body off the page thread. Absence means this viewport cannot offer the solved preset.
   *
   * @evidence contracts/common.md#principled-implementation The solved preset evaluates the current body and returns authored pose rows rather than reusing a fixed shape-independent arm pose.
   * @evidence contracts/common.md#clear-and-simple-design Returning only pose and shoulders leaves full-document composition and admission with the panel.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported solving is explicit absence rather than a guessed neutral pose or fabricated numerical result.
   * @evidence contracts/common.md#meaningful-documentation The member names off-thread solving, returned coordinate groups and the absent-operation meaning.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This optional solver signature selects no rig or anatomical inversion algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Preset-solving equivalence depends on the supplied document and is not implemented by this type.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The viewport's worker owns the asynchronous solver request behind this callback.
   */
  armsDown?: (
    document: IAutoMovieHumanBodyBasisDocument,
  ) => Promise<Pick<IAutoMovieHumanBodyBasisDocument, "pose" | "shoulders">>;
}
