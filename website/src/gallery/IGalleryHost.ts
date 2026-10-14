/**
 * The gallery controller's owned effect port. mountGallery supplies real native dialog/DOM operations; policy consumes observations without replacing those foreign methods. Native focus containment, Escape and inertness remain the browser's responsibility.
 *
 * @evidence contracts/common.md#principled-implementation An explicit effect port separates controller selection and close admission from native dialog observations; isOpen observes current state rather than assuming close notifications are current.
 * @evidence contracts/common.md#clear-and-simple-design The interface contains only effects actually supplied by mountGallery and consumed by GalleryController.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Portable controller tests supply this owned port while production retains its real browser methods; no foreign replacement is required by the contract.
 * @evidence contracts/common.md#meaningful-documentation Members identify browser responsibility, current-state observation, opener focus ownership and listener cleanup.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An erased effect contract chooses no implementation algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This interface defines effects but performs no sharing or caching.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type owns no native dialog or listener; mountGallery implements those lifetimes.
 *
 * @author Samchon
 */
export interface IGalleryHost<Opener> {
  /** Native modal availability; false retains ordinary authored links. */
  supportsModal: boolean;

  /**
   * Real current dialog state, including a newer opening after a delayed close.
   *
   * @evidence contracts/common.md#principled-implementation The native adapter reads dialog.open at observation time, supplying the state that admits a close notification.
   * @evidence contracts/common.md#clear-and-simple-design This observation leaves lock and focus decisions with GalleryController.closed.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The port requires a current observation rather than treating every queued close event as authoritative.
   * @evidence contracts/common.md#meaningful-documentation The member explains why a delayed close may observe a newer open dialog.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This erased method contract chooses no implementation algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This signature performs no observation caching.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This signature acquires no native state or listener.
   */
  isOpen(): boolean;

  /**
   * Replace building content and its view controls, releasing old listeners.
   *
   * @evidence contracts/common.md#principled-implementation An admitted authored building index selects its copy and controls; the host owns native rendering effects.
   * @evidence contracts/common.md#clear-and-simple-design The controller supplies identity while mountGallery owns DOM replacement.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The selected index addresses actual authored content rather than a second fixture catalogue.
   * @evidence contracts/common.md#meaningful-documentation The member states replacement and old-listener responsibility.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This signature implements no content traversal.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This signature coordinates no effect sharing.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The host implementation owns listener acquisition and release.
   */
  renderBuilding(index: number): void;

  /**
   * Replace the image before binding its own current error handler.
   *
   * @evidence contracts/common.md#principled-implementation Building and view indices identify the authored image whose native replacement receives current error authority.
   * @evidence contracts/common.md#clear-and-simple-design Image mutation stays with the adapter rather than controller navigation policy.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No previous image's error handler may substitute content for the current selection.
   * @evidence contracts/common.md#meaningful-documentation The member states replacement-before-handler ordering.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This signature performs no image processing.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This signature shares no image attachment effects.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The adapter owns current-image listener lifetime.
   */
  renderView(building: number, view: number): void;

  /**
   * Native modal entry; may throw its actual browser failure.
   *
   * @evidence contracts/common.md#principled-implementation The adapter calls the dialog's actual showModal operation after rendering admitted content.
   * @evidence contracts/common.md#clear-and-simple-design Browser modal acquisition remains a host effect exposed through one port.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A real modal failure is not replaced with a successful policy result.
   * @evidence contracts/common.md#meaningful-documentation The member states native entry and its throwing failure channel.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This signature implements no browser modal algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Modal entry effects cannot be shared by this erased signature.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Native modal lifetime belongs to the adapter and browser.
   */
  showModal(): void;

  /**
   * Native close request, distinct from the subsequent close observation.
   *
   * @evidence contracts/common.md#principled-implementation The adapter invokes dialog.close while the controller separately observes current open state.
   * @evidence contracts/common.md#clear-and-simple-design Request and observation have separate ports so queued native events do not imply current authority.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A close request is not represented as proof that a later event belongs to this opening.
   * @evidence contracts/common.md#meaningful-documentation The member distinguishes request from native close observation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This signature chooses no close-processing algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This signature caches no close effect or outcome.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Browser modal resources remain host-owned.
   */
  closeModal(): void;

  /**
   * Update only the gallery's owned document-scroll lock.
   *
   * @evidence contracts/common.md#principled-implementation The adapter toggles its gallery-open document class using the requested current lock state.
   * @evidence contracts/common.md#clear-and-simple-design Scroll-lock mutation stays outside controller state calculation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The effect targets only the gallery-owned class rather than replacing global scrolling methods.
   * @evidence contracts/common.md#meaningful-documentation The member bounds the effect to the gallery's document lock.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This erased signature performs no DOM update.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This signature shares no document mutation across mounts.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The mounted host owns the document and lock cleanup.
   */
  setLocked(locked: boolean): void;

  /**
   * Restore the original authored opener's focus.
   *
   * @evidence contracts/common.md#principled-implementation The actual opener supplied on admitted activation remains the focus destination despite building navigation.
   * @evidence contracts/common.md#clear-and-simple-design Controller ownership chooses the opener while the host performs native focus.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Focus is not redirected to the current building's button or a fixture-specific node.
   * @evidence contracts/common.md#meaningful-documentation The member identifies original-opener focus ownership.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This signature implements no browser focus algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Native focus effects are not shared by this contract.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The host owns the opener node; this signature retains nothing.
   */
  focus(opener: Opener): void;

  /**
   * Release current image, view and mounted event listeners.
   *
   * @evidence contracts/common.md#principled-implementation The mounted adapter retires image/view callback generations and attempts each owned listener removal.
   * @evidence contracts/common.md#clear-and-simple-design Content cleanup is one host operation coordinated with modal, lock and focus cleanup by the controller.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Callback return alone does not certify actual browser listener release.
   * @evidence contracts/common.md#meaningful-documentation The member names the three owned listener populations.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This signature performs no cleanup traversal.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Caller authority, rather than this type, prevents repeated effect attempts.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The mounted implementation owns acquisition, terminal retirement and failure reporting.
   */
  disposeContents(): void;
}
