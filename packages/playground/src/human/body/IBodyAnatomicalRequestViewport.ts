import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasisDocument";

import type { IBodyAnatomicalRequestModel } from "./IBodyAnatomicalRequestModel";

/**
 * The viewport a numerical request panel drives.
 *
 * `build` evaluates a request into a frame, `publish` shows an admitted frame and `dispose` requests owned retirement; `settleRetirements` observes its completion and failures. `cancel` withdraws the pending build. `export` encodes the candidate-only model, never a whole-body save. The view methods change only the camera and the clay display. Prepared frames belong to the viewport until the panel either publishes them or requests retirement. A retired stale frame must still reach `settleRetirements`; cancellation alone does not establish cleanup completion.
 *
 * @evidence contracts/common.md#principled-implementation Preparation, publication and retirement are distinct operations so intent admission can reject a completed stale frame without displaying it or losing cleanup failures.
 * @evidence contracts/common.md#clear-and-simple-design The panel sees frame lifecycle, candidate export and view controls through one adapter while numerical construction and GPU ownership stay with their implementation owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Candidate-only export preserves qualification limits, and asynchronous retirement failures remain observable rather than being hidden behind cancellation.
 * @evidence contracts/common.md#meaningful-documentation The interface comment explains prepared-frame ownership, publication admission and why retirement settlement remains required after stale completion.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This adapter contract chooses no geometry builder, encoder or camera algorithm; supplied viewport operations own their costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The viewport type provides no cache or equivalence relation for builds and exports; the transaction owner controls result admission.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Resource ownership is specified through dispose and settlement callbacks, but this declaration acquires no frames or renderer handles itself.
 *
 * @author Samchon
 */
export interface IBodyAnatomicalRequestViewport<
  Model extends IBodyAnatomicalRequestModel,
> {
  /**
   * Prepare one request as a viewport-owned frame, rejecting numerical or rendering preparation failures before publication.
   *
   * @evidence contracts/common.md#principled-implementation Promise-based preparation returns a frame for qualification before the panel changes the displayed state.
   * @evidence contracts/common.md#clear-and-simple-design Build exposes prepared output while publication remains an explicit separate operation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A prepared frame is not declared clinically resolved or automatically admitted by this callback.
   * @evidence contracts/common.md#meaningful-documentation The build comment identifies preparation ownership, rejection and its pre-publication position.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Numerical and renderer preparation algorithms belong to the injected build implementation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This signature promises no cached frame identity or merging of equal request documents.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type describes frame ownership without allocating it; viewport retirement handles unadmitted completions.
   */
  build: (document: IAutoMovieHumanBodyBasisDocument) => Promise<Model>;

  /**
   * Show a prepared frame after the panel admits its document and candidate qualification.
   *
   * @evidence contracts/common.md#principled-implementation Explicit publication separates visible state replacement from asynchronous frame preparation and qualification.
   * @evidence contracts/common.md#clear-and-simple-design The publication callback accepts the already prepared model without repeating document parsing or numerical construction.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Publication relies on the caller's admission rather than certifying a frame merely because preparation completed.
   * @evidence contracts/common.md#meaningful-documentation The comment places prepared-frame display after document and qualification admission.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This publication signature chooses no renderer upload or scene-update algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Visible publication is an effect and this type declares no deduplication across equal models.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Renderer handle transfer and retirement of previous displays belong to the publication implementation.
   */
  publish: (model: Model) => void;

  /**
   * Request retirement of a frame's owned resources; observe completion and failures through `settleRetirements`.
   *
   * @evidence contracts/common.md#principled-implementation Retirement is requested separately from settlement because owned cleanup may finish asynchronously and fail.
   * @evidence contracts/common.md#clear-and-simple-design The frame identifies the retirement target without exposing each renderer resource to the panel.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A void retirement request is not presented as proof that every resource was released.
   * @evidence contracts/common.md#meaningful-documentation The operation comment directs callers to settlement for actual completion and failures.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This retirement member selects no traversal or disposal order for frame resources.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Cleanup is an ownership effect with no declared result sharing across distinct frames.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration requests cleanup while the viewport implementation owns acquired handles and pending retirements.
   */
  dispose: (model: Model) => void;

  /**
   * Await requested owned retirement and reject with its actual cleanup failures.
   *
   * @evidence contracts/common.md#principled-implementation A settlement promise preserves the asynchronous cleanup outcome that a synchronous dispose request cannot convey.
   * @evidence contracts/common.md#clear-and-simple-design One settlement entry observes viewport-owned retirement without exporting its internal cleanup queue.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Cleanup rejection is retained rather than converted into a successful publication or swallowed completion.
   * @evidence contracts/common.md#meaningful-documentation The settlement comment states both its await boundary and failure propagation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This promise signature implements no retirement scheduling or queue draining algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Observing outstanding cleanup has no declared cross-viewport sharing or cache identity.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retirement tasks remain owned by the viewport implementation until the settlement it exposes completes.
   */
  settleRetirements: () => Promise<void>;

  /**
   * Withdraw the pending build; completed stale frames still require retirement.
   *
   * @evidence contracts/common.md#principled-implementation Build withdrawal marks obsolete work separately from disposing a frame that may already have finished.
   * @evidence contracts/common.md#clear-and-simple-design The cancellation entry hides the worker or generation mechanism from the numerical request panel.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Cancellation does not claim immediate worker termination or successful release of completed GPU resources.
   * @evidence contracts/common.md#meaningful-documentation The callback states withdrawal and the remaining completed-frame retirement obligation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This cancellation signature defines no queue or worker interruption algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Withdrawing an intent is an effect rather than reusable numerical work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The viewport owns pending build resources; this member itself acquires no cancellation handle.
   */
  cancel: () => void;

  /**
   * Encode this request's candidate-only model as caller-owned GLB bytes; never a whole-body clinical save.
   *
   * @evidence contracts/common.md#principled-implementation Export receives the admitted request document so its encoded candidate remains tied to the numerical input being saved.
   * @evidence contracts/common.md#clear-and-simple-design Returning bytes leaves file delivery to the panel's download sink and encoding to the viewport adapter.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The export contract explicitly retains candidate-only qualification instead of claiming complete clinical geometry.
   * @evidence contracts/common.md#meaningful-documentation The member identifies caller byte ownership, GLB format and the candidate-only scope.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This encoding signature chooses no tessellation, serialization or buffer-allocation algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The contract declares no shared export buffer or cached byte identity between requests.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Exported bytes transfer as ordinary caller data; implementation-owned temporary frames and encoders require their own cleanup.
   */
  export: (
    document: IAutoMovieHumanBodyBasisDocument,
  ) => Promise<Uint8Array<ArrayBuffer>>;

  /**
   * Fit the camera to the currently displayed subject without editing the numerical request.
   *
   * @evidence contracts/common.md#principled-implementation Camera fitting uses the displayed subject while preserving authored anatomical request data.
   * @evidence contracts/common.md#clear-and-simple-design One view operation keeps camera framing out of the panel's numerical document transaction.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Framing changes do not substitute a new body shape to make the subject fit.
   * @evidence contracts/common.md#meaningful-documentation The comment distinguishes the displayed subject and camera effect from authored request changes.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The callable fit contract implements no bounds scan or camera-distance computation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Fitting is a view effect with no declared cache across changing displays.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Existing camera resources remain viewport-owned; fitting acquires none in this declaration.
   */
  fitView: () => void;

  /**
   * Turn the camera to an azimuth in degrees, leaving the numerical request unchanged.
   *
   * @evidence contracts/common.md#principled-implementation A degree-valued azimuth defines a view change independently of source-rig anatomical coordinates.
   * @evidence contracts/common.md#clear-and-simple-design The panel delegates camera orientation without needing renderer matrices or orbit internals.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A camera preset changes observation direction without posing or reshaping the displayed candidate.
   * @evidence contracts/common.md#meaningful-documentation The camera comment specifies azimuth units and preservation of numerical request data.
   * @evidenceExclude contracts/performance.md#efficient-algorithms No orbit or camera-matrix algorithm is chosen by this azimuth callback type.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reorienting a camera is an observable view effect with no shared numerical result.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The camera-view signature holds no renderer handle and starts no independently owned task.
   */
  cameraView: (degrees: number) => void;

  /**
   * Toggle the clay inspection display without changing authored materials or numerical anatomy.
   *
   * @evidence contracts/common.md#principled-implementation Clay is an inspection presentation mode rather than a rewrite of the candidate's authored anatomy or material parameters.
   * @evidence contracts/common.md#clear-and-simple-design A boolean view hook leaves material override implementation with the renderer owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The mode supplies structural inspection and makes no beauty-material or clinical-validity claim.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies clay inspection and the authored data it preserves.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This toggle declaration chooses no material traversal or GPU update strategy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Display-mode changes are effects, and material sharing is owned by the supplied viewport.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Renderer-owned override materials and their disposal are outside this boolean callback schema.
   */
  setClay: (enabled: boolean) => void;
}
