import type { IAutoMovieHumanFaceBasisDocument } from "@automovie/human";

/**
 * The numerical viewport the connected face panel drives: builds, publishes and exports face documents, and owns camera and display state.
 *
 * Build returns a prepared frame before admission; the panel either publishes or retires it and awaits settlement. The viewport owns its resident numerical connection. A stage preserves borrowed host GPU services, while the browser factory additionally releases the renderer, orbit controls and resize observer it acquired.
 *
 * @evidence contracts/common.md#principled-implementation Separate preparation, publication and retirement let the panel discard stale frames without losing cleanup failures or displaying an unadmitted document.
 * @evidence contracts/common.md#clear-and-simple-design Numerical and GPU frame lifecycle plus view controls remain behind one viewport while the panel owns document admission and history.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A successful build is not itself an admitted or clinically valid face, and cleanup completion is not guessed from a synchronous dispose call.
 * @evidence contracts/common.md#meaningful-documentation The comment assigns prepared-frame admission and retirement, owned numerical connection and stage-versus-browser GPU acquisition duties.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This viewport contract implements no numerical, encoding or renderer algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type provides lifecycle seams without implementing source, topology or completed-frame cache identity.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The schema allocates no frame or worker itself; actual viewport implementations acquire and retire them.
 *
 * @author Samchon
 */
export interface IConnectedFaceViewport<Model> {
  /**
   * Prepare a face frame; omitted measure and occlusion flags are false. The panel must publish an admitted frame or retire it.
   *
   * @evidence contracts/common.md#principled-implementation Inspection and occlusion flags request numerical preparation explicitly without changing the canonical authored document.
   * @evidence contracts/common.md#clear-and-simple-design Returning a prepared model leaves the panel's transaction in control of visible publication.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Unrequested readings are not fabricated and preparation completion does not bypass admission.
   * @evidence contracts/common.md#meaningful-documentation The member identifies false flag defaults and the publish-or-retire obligation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Numerical construction and texture preparation algorithms belong to the build implementation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The callback promises no sharing of mutable prepared frames between independent documents.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The viewport implementation owns prepared-frame resources until explicit publication or retirement.
   */
  build: (
    document: IAutoMovieHumanFaceBasisDocument,
    measure?: boolean,
    occlusion?: boolean,
  ) => Promise<Model>;

  /**
   * Withdraw pending preview authority; a completed stale prepared frame still needs retirement.
   *
   * @evidence contracts/common.md#principled-implementation Preview withdrawal uses request/generation authority independently of native worker completion order.
   * @evidence contracts/common.md#clear-and-simple-design One cancellation seam hides correlation details from the face panel.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Cancellation does not claim instant numerical interruption or successful GPU cleanup.
   * @evidence contracts/common.md#meaningful-documentation The comment distinguishes withdrawn pending authority from completed-frame retirement.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This signature chooses no pending request lookup or interruption algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Withdrawal is an intent effect rather than reusable numerical work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The numerical owner retains active evaluation until reply or final connection disposal.
   */
  cancel: () => void;

  /**
   * Encode the explicit document into caller-owned GLB bytes; omitted occlusion is false and export does not publish a preview.
   *
   * @evidence contracts/common.md#principled-implementation Explicit document export runs separately from preview publication and includes occlusion only when requested.
   * @evidence contracts/common.md#clear-and-simple-design Encoded bytes return to the panel's file sink without sharing scene capture or history authority.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Successful encoding does not certify clinical or visual acceptance of the document.
   * @evidence contracts/common.md#meaningful-documentation The member states GLB byte ownership, occlusion default and nonpublication semantics.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The export type chooses no geometry build or serialization algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Export is a separate user effect and promises no cached byte buffer identity.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returned ordinary bytes transfer to the caller while temporary encoder resources stay implementation-owned.
   */
  export: (
    document: IAutoMovieHumanFaceBasisDocument,
    occlusion?: boolean,
  ) => Promise<Uint8Array<ArrayBuffer>>;

  /**
   * Show a prepared frame after document admission joins it to committed history state.
   *
   * @evidence contracts/common.md#principled-implementation Explicit synchronous publication lets document/model agreement precede visible frame replacement.
   * @evidence contracts/common.md#clear-and-simple-design Display uses the prepared model instead of repeating numerical construction.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Preparation alone does not establish the caller's admission verdict.
   * @evidence contracts/common.md#meaningful-documentation The member identifies prepared input and post-admission display.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This callback selects no scene or buffer update algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Publication is a visible effect; renderer buffer reuse remains implementation-owned.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Published frame transfer and prior display retirement belong to the viewport renderer.
   */
  publish: (model: Model) => void;

  /**
   * Request retirement of an unadmitted or temporary frame; await completion through settlement.
   *
   * @evidence contracts/common.md#principled-implementation Unused prepared frames retire through the owner that allocated their textures and buffers.
   * @evidence contracts/common.md#clear-and-simple-design Model identity is sufficient for cleanup without exposing renderer internals to the panel.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A synchronous retirement request is not proof that asynchronous release succeeded.
   * @evidence contracts/common.md#meaningful-documentation The comment names temporary/unadmitted frames and directs completion to settlement.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This callback chooses no texture or buffer disposal traversal.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Retirement is an ownership effect without shared numerical output.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The viewport's renderer owns requested frame retirement rather than this type declaration.
   */
  dispose: (model: Model) => void;

  /**
   * Await requested resource retirement without rolling back an already published model.
   *
   * @evidence contracts/common.md#principled-implementation Awaited cleanup preserves failures after synchronous history publication without restoring an older document/model pair.
   * @evidence contracts/common.md#clear-and-simple-design One settlement boundary observes stage and numerical renderer retirement owners.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Failed cleanup remains an observable rejection instead of a guessed successful release.
   * @evidence contracts/common.md#meaningful-documentation The member states requested retirement, completion and preservation of the published model.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This signature selects no retirement queue scheduling algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Cleanup coordination and repeated settlement identity belong to the supplied implementation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Outstanding retirement tasks remain viewport-owned until actual settlement.
   */
  settleRetirements: () => Promise<void>;

  /**
   * Retire owned frames and the resident numerical connection. A stage preserves borrowed GPU host services; a browser mount also releases its own renderer, controls and observer.
   *
   * @evidence contracts/common.md#principled-implementation Closure follows numerical/frame acquisition ownership before browser service release, preserving a borrowed stage renderer for its external owner.
   * @evidence contracts/common.md#clear-and-simple-design One owner completion closes the mounted viewport without caller-managed native worker termination.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Closure ends owned pending numerical work while preserving another owner's borrowed GPU services and actual release failures.
   * @evidence contracts/common.md#meaningful-documentation The member distinguishes owned numerical connection and browser acquisitions from borrowed stage services.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This close signature chooses no resource disposal traversal.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Idempotent final retirement is an implementation responsibility rather than a numerical result cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The callable type exposes final lifetime completion while the actual stage and browser owners hold resources.
   */
  close: () => Promise<void>;

  /**
   * Fit the camera to the displayed frame without editing authored face parameters.
   *
   * @evidence contracts/common.md#principled-implementation Camera framing observes displayed bounds independently of canonical numerical face state.
   * @evidence contracts/common.md#clear-and-simple-design The panel delegates camera distance and target computation to the viewport.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Fitting changes the camera rather than resizing geometry to an expected picture.
   * @evidence contracts/common.md#meaningful-documentation The comment distinguishes framing from authored parameter mutation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This callback chooses no bounds or projection-distance algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Camera fitting is a display effect with no declared numerical cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Existing camera state stays viewport-owned and no independent handle is acquired.
   */
  fitView: () => void;

  /**
   * Set observation yaw in degrees while preserving authored face expression and shape.
   *
   * @evidence contracts/common.md#principled-implementation Degree-valued yaw selects camera observation rather than a numerical face articulation.
   * @evidence contracts/common.md#clear-and-simple-design A scalar hook keeps orbit matrices outside face document controls.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A camera preset does not pose or reshape the face to change observation direction.
   * @evidence contracts/common.md#meaningful-documentation The member identifies yaw units and preservation of authored shape/expression.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Camera distance, target and orbit matrix computation belong to the supplied viewport implementation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work View reorientation is an effect without shared numerical output.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Camera yaw acquires no new worker or renderer handle.
   */
  cameraView: (degrees: number) => void;

  /**
   * Toggle clay inspection display without rewriting authored materials.
   *
   * @evidence contracts/common.md#principled-implementation Clay is a presentation override distinct from canonical face finish parameters.
   * @evidence contracts/common.md#clear-and-simple-design The viewport owns override material application behind one boolean hook.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Clay supplies structural inspection without certifying beauty finish or clinical validity.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies inspection mode and preserved authored materials.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This toggle signature selects no material traversal.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Override material sharing belongs to the renderer rather than this type.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The renderer owns any override material and its final release.
   */
  setClay: (enabled: boolean) => void;

  /**
   * Toggle inspection shadow casters without editing numerical geometry.
   *
   * @evidence contracts/common.md#principled-implementation Shadow caster visibility is display state independent of face document admission.
   * @evidence contracts/common.md#clear-and-simple-design One boolean delegates shadow presentation to the viewport owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Shadows do not repair contact geometry or establish anatomical validity.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies inspection casters and preserved numerical geometry.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This toggle type chooses no caster or shadow-map update algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shadow invalidation and reuse belong to the renderer implementation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Existing shadow-map resources remain owned by the viewport.
   */
  setShadows: (enabled: boolean) => void;
}
