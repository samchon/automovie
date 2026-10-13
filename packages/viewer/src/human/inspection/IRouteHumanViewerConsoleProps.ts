/**
 * The server's reactions to the page's console protocol lines.
 *
 * @evidence contracts/common.md#principled-implementation Console reactions keep work, source failure, retained-display failure/recovery and ready revision as distinct protocol events.
 * @evidence contracts/common.md#clear-and-simple-design The router owns prefix dispatch while the host supplies one reaction per event kind.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A display recovery event does not clear an independent source error or invent current-generation readiness.
 * @evidence contracts/common.md#meaningful-documentation Documents the meaning and owner reaction for each console prefix, including optional cache persistence readings.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Console reactions keep work, source failure, retained-display failure/recovery and ready revision as distinct protocol events.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor The router owns prefix dispatch while the host supplies one reaction per event kind.
 * @author Samchon
 */
export interface IRouteHumanViewerConsoleProps {
  /**
   * A `HUMAN_WORK` progress record, as its JSON text.
   *
   * @evidence contracts/common.md#principled-implementation Work reactions consume the original JSON progress payload after its console prefix.
   * @evidence contracts/common.md#clear-and-simple-design The router strips the prefix and the host owns parsing and progress state.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A progress record is not converted into a finished numerical or display result.
   * @evidence contracts/common.md#meaningful-documentation Defines the HUMAN_WORK JSON-text callback.
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-review Work reactions consume the original JSON progress payload after its console prefix.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-review The router strips the prefix and the host owns parsing and progress state.
   */
  work: (text: string) => void;

  /**
   * A `HUMAN_ERROR` line: the page's current generation failed.
   *
   * @evidence contracts/common.md#principled-implementation The source-error reaction receives the reported failure of the page's current generation.
   * @evidence contracts/common.md#clear-and-simple-design Source failure state remains host-owned and independent from retained-display recovery.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A failed source generation is not relabelled ready because an older display remains visible.
   * @evidence contracts/common.md#meaningful-documentation Defines the HUMAN_ERROR failure-message input.
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state The source-error reaction receives the reported failure of the page's current generation.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Source failure state remains host-owned and independent from retained-display recovery.
   */
  error: (message: string) => void;

  /**
   * A failure of the retained display, separate from source compilation.
   *
   * @evidence contracts/common.md#principled-implementation Display failure concerns the retained visible generation separately from source compilation.
   * @evidence contracts/common.md#clear-and-simple-design The host owns display error state and the console router only dispatches the message.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A display failure cannot be erased by an unrelated source or progress notification.
   * @evidence contracts/common.md#meaningful-documentation Defines the retained-display failure callback and its message.
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Display failure concerns the retained visible generation separately from source compilation.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor The host owns display error state and the console router only dispatches the message.
   */
  displayError: (message: string) => void;

  /**
   * The retained display completed again; source errors remain independent.
   *
   * @evidence contracts/common.md#principled-implementation Recovery reports completion of the retained display without claiming current-source compilation.
   * @evidence contracts/common.md#clear-and-simple-design One no-argument reaction keeps display recovery distinct from ready-revision publication.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Independent source errors remain outstanding after an old display recovers.
   * @evidence contracts/common.md#meaningful-documentation Documents retained-display recovery and the unchanged source-error boundary.
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Recovery reports completion of the retained display without claiming current-source compilation.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor One no-argument reaction keeps display recovery distinct from ready-revision publication.
   */
  displayRecovered: () => void;

  /**
   * A `HUMAN_READY` line: the named generation can draw.
   *
   * @evidence contracts/common.md#principled-implementation Ready publication carries the revision the page reports as drawable.
   * @evidence contracts/common.md#clear-and-simple-design The host keeps generation readiness behind a revision-bearing callback.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A ready revision is not inferred from an arbitrary console line or old screenshot.
   * @evidence contracts/common.md#meaningful-documentation Defines the HUMAN_READY revision input.
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-current-stale Ready publication carries the revision the page reports as drawable.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity The host keeps generation readiness behind a revision-bearing callback.
   */
  ready: (revision: string) => void;

  /**
   * A `HUMAN_ADMISSION` line: a viewer frame loaded its module and can judge documents.
   *
   * @evidence contracts/common.md#principled-implementation Admission notification states that a frame loaded the module required to judge documents.
   * @evidence contracts/common.md#clear-and-simple-design The host owns admission scheduling rather than the prefix router.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Module availability does not establish that every document has passed construction admission.
   * @evidence contracts/common.md#meaningful-documentation Defines the HUMAN_ADMISSION capability notification.
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Admission notification states that a frame loaded the module required to judge documents.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor The host owns admission scheduling rather than the prefix router.
   */
  admission: () => void;

  /**
   * A `HUMAN_RESTART` line: a candidate mixed compiles and the host started a fresh one.
   *
   * @evidence contracts/common.md#principled-implementation The restart reaction receives the candidate's reported mixed-compile reason.
   * @evidence contracts/common.md#clear-and-simple-design The candidate host retains generation recovery decisions outside console routing.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The event is not a timer-based authorization to restart a retained valid display.
   * @evidence contracts/common.md#meaningful-documentation Defines the HUMAN_RESTART reason and its candidate-generation meaning.
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state The restart reaction receives the candidate's reported mixed-compile reason.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor The candidate host retains generation recovery decisions outside console routing.
   */
  restart: (reason: string) => void;

  /**
   * A `HUMAN_FIRST_ADDRESS` line: a candidate could not show its first address and opened on the standard document.
   *
   * @evidence contracts/common.md#principled-implementation First-address fallback reports why the candidate could not display its requested opening address.
   * @evidence contracts/common.md#clear-and-simple-design The candidate owns fallback selection; the router only forwards the reason.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Fallback notification cannot claim successful construction of the failed original address.
   * @evidence contracts/common.md#meaningful-documentation Documents the HUMAN_FIRST_ADDRESS failure reason and standard-document fallback.
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state First-address fallback reports why the candidate could not display its requested opening address.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor The candidate owns fallback selection; the router only forwards the reason.
   */
  firstAddress: (reason: string) => void;

  /**
   * Independent optional persistence result and its measured codec/write durations.
   *
   * @evidence contracts/common.md#principled-implementation The optional cache reaction receives the independent persistence result and measured codec/write timings.
   * @evidence contracts/common.md#clear-and-simple-design Cache-result handling remains separate from source and display readiness callbacks.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Persistence success or failure cannot substitute for numerical construction or completed display.
   * @evidence contracts/common.md#meaningful-documentation Defines the optional HUMAN_CACHE JSON-text reading.
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-current-stale The optional cache reaction receives the independent persistence result and measured codec/write timings.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Cache-result handling remains separate from source and display readiness callbacks.
   */
  cache?: (text: string) => void;
}
