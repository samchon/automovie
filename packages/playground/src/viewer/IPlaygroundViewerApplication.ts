/**
 * Application-owned input capture/restoration supplied to the same-origin page bridge. The original editor or film transaction restores its own input; it can expose accepted input or a labelled construction draft. Readiness and restored document equality do not independently establish qualification, visible hardware completion or anatomical health.
 *
 * @evidence contracts/common.md#principled-implementation Capture and restore preserve original transaction ownership while the bridge separately observes completed producer frames and the host admits or refuses candidate replacement.
 * @evidence contracts/common.md#clear-and-simple-design One registration carries readiness, actual input and optional view reflection/empty-editor capability without cloning an editor or synthesizing DOM events.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Failed restoration may leave the candidate changed and does not roll back the retained prior page; empty admission is an explicit existing application capability, not a fabricated model bitmap.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes application input, qualification, candidate failure and separate completed-display authority.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface chooses no restore, equality, drawing or source-admission algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Registration declares no cached input/build equivalence; actual source/input/view identities remain implementation-owned.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Callback references acquire no resources here; page bridge, application and renderer implementations own actual listener/task/frame lifetimes.
 *
 * @author Samchon
 */
export interface IPlaygroundViewerApplication {
  /** Initial application transaction completion; a rejection refuses admission. */
  ready: Promise<void>;

  /**
   * Serializable displayed input, including a retained construction draft; undefined means none is exposed.
   *
   * @evidence contracts/common.md#principled-implementation The original input owner supplies its actual display state rather than the host reconstructing values from DOM controls.
   * @evidence contracts/common.md#clear-and-simple-design One capture callback separates document/film input from the viewport's independently captured controls.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Captured input is not proof of accepted history or qualification; unavailable state remains undefined.
   * @evidence contracts/common.md#meaningful-documentation The member defines serializable actual display and undefined/draft meaning.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The callback signature selects no serialization or state-copy strategy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work It stores no prior state or equality cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Captured data lifetime and callback retention belong to the concrete application and bridge.
   */
  capture: () => unknown;

  /**
   * Restore through the original transaction or reject the candidate. Candidate mutations/rollback belong to that application; rejection leaves the prior completed page available to the host.
   *
   * @evidence contracts/common.md#principled-implementation Original transaction restoration preserves its parser/admission and authored effects instead of the bridge assigning guessed document fields.
   * @evidence contracts/common.md#clear-and-simple-design Promise completion exposes the input owner's restore boundary while hardware completion and source freshness are checked separately.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Rejection refuses candidate admission without claiming candidate rollback or retiring the prior good page.
   * @evidence contracts/common.md#meaningful-documentation The member states mutation ownership, failure propagation and retained prior-page availability.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Restoration construction/parsing cost belongs to the supplied implementation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type promises no merging or reuse of effectful restoration.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The signature owns no candidate task or frame; application/page implementations own their cleanup.
   */
  restore: (state: unknown) => Promise<void>;

  /** An intentionally empty input editor may be shown without a subject bitmap. */
  empty?: boolean;

  /**
   * Reflect restored view in application controls without replaying events; omission exposes no separate reflection step.
   *
   * @evidence contracts/common.md#principled-implementation The original application synchronizes its controls with viewport-owned restored state rather than dispatching synthetic edit events.
   * @evidence contracts/common.md#clear-and-simple-design Optional reflection keeps widget ownership outside the page bridge's frame producer.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Omission does not fabricate a control update or claim that unsupported view state was restored.
   * @evidence contracts/common.md#meaningful-documentation The member defines event-free reflection and its optional absence.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This signature chooses no widget lookup/update traversal.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work It declares no cached reflection or input equivalence.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources DOM/control lifetime remains with the application, not this optional callback declaration.
   */
  reflectView?: (state: unknown) => void;
}
