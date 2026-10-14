import type { IHumanViewerWatchedSource } from "./IHumanViewerWatchedSource.js";

/**
 * What source watching needs from the host.
 *
 * @evidence contracts/common.md#principled-implementation Source watching separates input rescans from reached-source revision batches and supplies exact listener withdrawal plus cancellable scheduling.
 * @evidence contracts/common.md#clear-and-simple-design The source owner supplies paths/digests and the host supplies publication reactions; subscription code owns coalescing rather than filesystem or catalogue internals.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reached edits dirty candidate proof immediately, while only completed digest movement publishes a browser revision notification.
 * @evidence contracts/common.md#meaningful-documentation Members identify input versus source effects, immediate reached notification, the default 100 ms coalescing timer and exact-listener cleanup.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The host-capability table chooses no event Set, timer or import-graph traversal implementation.
 * @evidence contracts/performance.md#reuse-equivalent-work Coalescing shares repeated path invalidations in one pending batch; source-owner digest comparisons decide actual domain movement.
 * @evidence contracts/performance.md#bound-retention-and-release-resources watch lends one exact-listener remover and schedule lends one timer canceler; the subscription invokes both on close while the caller owns the watcher itself.
 *
 * @author Samchon
 */
export interface ISubscribeHumanViewerSourcesProps {
  /** The source owner. */
  source: IHumanViewerWatchedSource;

  /**
   * Add source, input and publication paths to the caller-owned watcher.
   *
   * @evidence contracts/common.md#principled-implementation Source and publication paths are registered before listening for edits so later file creation can refresh its authority.
   * @evidence contracts/common.md#clear-and-simple-design Path registration remains a borrowed watcher operation rather than constructing another filesystem watcher.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Actual source-owner paths are watched, including generation directories whose view files may not yet exist.
   * @evidence contracts/common.md#meaningful-documentation The member defines adding source/input/publication paths to the caller's watcher.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This registration capability chooses no native watch backend or path-indexing algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Registration is an owned watch effect; equal path text alone does not permit sharing independent watcher lifetimes.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the watcher and its path registrations; the subscription owns only its attached event listener.
   */
  add: (files: string[]) => void;

  /**
   * Subscribe to watcher events and return removal of exactly this listener.
   *
   * @evidence contracts/common.md#principled-implementation One listener observes filesystem event/path pairs, and the returned operation removes that exact observer from the existing watcher.
   * @evidence contracts/common.md#clear-and-simple-design Listener acquisition and withdrawal share one callback boundary without exposing foreign event-emitter internals.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsubscription must not clear another consumer's listeners or patch the watcher methods.
   * @evidence contracts/common.md#meaningful-documentation The member explicitly documents exact-listener removal as the subscription's return value.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The event-subscription signature selects no watcher dispatch or listener-list representation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each listener owns distinct publication effects; matching source paths do not make independent subscriptions interchangeable.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The subscription owns the returned remover and invokes it at close, while the host retains the underlying watcher handle.
   */
  watch: (changed: (event: string, input: string) => void) => () => void;

  /**
   * Reread the catalogue after an input, generation-view or example change.
   *
   * @evidence contracts/common.md#principled-implementation Input-only edits refresh document discovery and admission without replacing unrelated loaded numerical source modules.
   * @evidence contracts/common.md#clear-and-simple-design Catalogue rereading is a host reaction separate from import-graph digest recomputation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Changed sidecars and examples are not ignored merely because their files are outside executed source graphs.
   * @evidence contracts/common.md#meaningful-documentation The member identifies input, generation-view and example changes that trigger rereading.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This rescan notification selects no document enumeration or parsing strategy.
   * @evidence contracts/performance.md#reuse-equivalent-work Catalogue owners reuse unchanged file facts while reapplying updated admission; this callback does not fabricate a new source revision.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Input refresh owns no new watcher handle; catalogue and admission owners retain any started tasks.
   */
  inputs: () => void;

  /**
   * Publish the changed paths and domains whose completed revision digests moved.
   *
   * @evidence contracts/common.md#principled-implementation Publication follows completed domain-digest comparisons rather than announcing all watched edits as source authority changes.
   * @evidence contracts/common.md#clear-and-simple-design The host receives paths and moved domains while the revision owner retains graph computation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An unchanged digest is not reported as movement solely to force a desired cache invalidation.
   * @evidence contracts/common.md#meaningful-documentation The member documents changed-path provenance and actually moved completed domains.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This publication capability chooses no dependency scan or digest comparison implementation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Publishing movement is a host effect distinct from memoized source text or completed numerical results.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Publication lends path/domain arrays without transferring worker or source-subscription ownership.
   */
  publish: (files: string[], moved: string[]) => void;

  /**
   * Report whether source edits are pending or computing, so candidate labels cannot claim settled authority early.
   *
   * @evidence contracts/common.md#principled-implementation Updating remains true across a pending timer and overlapping computations until no source batch remains outstanding.
   * @evidence contracts/common.md#clear-and-simple-design One boolean reaction communicates batching readiness to the generation-window owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Candidate source proof cannot treat queued but uncomputed edits as settled current code.
   * @evidence contracts/common.md#meaningful-documentation The member states pending/computing semantics and its candidate-label authority effect.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This state-notification signature chooses no batch-counter or timer algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Source-updating status is current mutable state rather than a reusable completed digest.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Reporting a boolean acquires no source window or worker task; those owners hold their own lifetimes.
   */
  updating: (value: boolean) => void;

  /**
   * Notify the browser after its completed source-domain revision moved.
   *
   * @evidence contracts/common.md#principled-implementation The browser receives invalidation only when the completed browser-domain digest appears among moved domains.
   * @evidence contracts/common.md#clear-and-simple-design Browser notification is separate from generic source publication because numerical-only domain movement has different consumers.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An unchanged browser graph does not trigger a fabricated browser-authority movement.
   * @evidence contracts/common.md#meaningful-documentation The comment specifies notification after actual browser-domain revision movement.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This browser notification chooses no transport or candidate-reload algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A notification changes browser generation preparation and is not a shared digest-computation result.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Browser transport and candidate lifetimes stay host-owned; this callback acquires no page or subscription.
   */
  browser: () => void;

  /**
   * Report the original failure while processing watched edits.
   *
   * @evidence contracts/common.md#principled-implementation Edit-processing exceptions reach the host error channel without replacing their original cause value.
   * @evidence contracts/common.md#clear-and-simple-design The subscription reports failures while the host decides status/log representation and source recovery.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Failed digest computation is not published as successful source movement or silently retried under another authority.
   * @evidence contracts/common.md#meaningful-documentation The member identifies original edit-processing failure reporting.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The error reaction chooses no exception classification or recovery strategy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Failure reporting is an observation of one edit attempt rather than an equivalent successful cached computation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only the failure is lent to the host; pending computation ownership remains with the revision service.
   */
  error: (error: unknown) => void;

  /**
   * Told, at once, of every edit to a file some build reads or a published basis.
   *
   * @evidence contracts/common.md#principled-implementation Reached-edit notification dirties open candidate windows immediately, before the delayed digest batch can prove its new revision.
   * @evidence contracts/common.md#clear-and-simple-design Immediate proof invalidation is separate from coalesced completed-digest publication.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A candidate cannot remain proven under source edits merely because the coalescing timer has not fired.
   * @evidence contracts/common.md#meaningful-documentation The comment defines immediate notification for build-reached source or published-basis edits.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The optional notification selects no candidate-window traversal or dependency reach implementation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Every reached edit may invalidate an open observation window; a prior notification is not proof that later edits are covered.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Candidate windows remain generation-owner resources; this callback transfers no holds or connections.
   */
  reached?: () => void;

  /**
   * Schedule one pending batch and return its cancellation operation; the default coalescing delay is 100 ms.
   *
   * @evidence contracts/common.md#principled-implementation A cancellable delayed callback coalesces nearby file events while preserving actual revision computation after dispatch.
   * @evidence contracts/common.md#clear-and-simple-design Scheduling is a borrowed host capability with one cancellation result; the subscription retains only its latest pending callback.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The timer is an event-coalescing interval, not a timeout that certifies compilation or rendering success.
   * @evidence contracts/common.md#meaningful-documentation The member specifies cancellation ownership and the concrete default 100 ms batching delay.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The scheduler signature selects no timer backend or event-loop implementation.
   * @evidence contracts/performance.md#reuse-equivalent-work New reached edits cancel the previous pending callback and reuse the shared path Set before one batch dispatch.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The subscription owns the returned canceler, replaces it on rescheduling and invokes it at close; dispatched work belongs to the revision owner.
   */
  schedule?: (run: () => void) => () => void;
}
