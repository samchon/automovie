import type { ViteDevServer } from "vite";

import type { HumanViewerMiddleware } from "./HumanViewerMiddleware.js";

import type { IHumanViewerCatalogue } from "./IHumanViewerCatalogue.js";
import type { IHumanViewerInstance } from "./IHumanViewerInstance.js";
import type { ISubscribeHumanViewerSourcesProps } from "./ISubscribeHumanViewerSourcesProps.js";
import type { createHumanViewerSource } from "./createHumanViewerSource.js";

/**
 * Ownership and readiness bindings for one attached server lifetime.
 *
 * @evidence contracts/common.md#principled-implementation Server lifetime bindings combine application Vite creation, owned source authority and page readiness before publishing acceptance under the reported-renderer policy.
 * @evidence contracts/common.md#clear-and-simple-design The server coordinates listening, source subscription and shutdown while existing host callbacks retain renderer recovery and catalogue ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Publication requires page-reported readiness and renderer-text classification; generic fallback text can pass, so this does not independently prove hardware, visible models or working controls.
 * @evidence contracts/common.md#meaningful-documentation Comments identify launcher ownership, source-change bindings, first-ready completion and closure limited to this server's renderer resources.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The lifetime-props shape chooses no Vite startup, source batching or browser recovery algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Starting a server and its listener is an owned effect; equal configuration does not make separate server lifetimes interchangeable.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The server owns Vite/listening/subscription lifetime and borrows renderer closure; failure-safe cleanup of partially started lifetimes must be enforced by startHumanViewerServer.
 *
 * @author Samchon
 */
export interface IStartHumanViewerServerProps {
  /**
   * Create this lifetime's Vite server from application-owned configuration and middleware.
   *
   * @evidence contracts/common.md#principled-implementation Application configuration creates the actual Vite/HTTP server that this viewer lifetime will listen with and close.
   * @evidence contracts/common.md#clear-and-simple-design The application owns configuration while startHumanViewerServer owns the returned server's listening and teardown sequence.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The factory returns the real application server rather than a readiness stub or replacement network implementation.
   * @evidence contracts/common.md#meaningful-documentation The member states creation ownership and the application configuration/middleware boundary.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This factory signature chooses no Vite module transform or HTTP dispatch algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Creating a listening-server owner is an effectful acquisition, not a result shared simply by equal configuration.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Ownership of the created Vite server passes to this lifetime, which must close it on startup failure and shutdown.
   */
  createVite: () => Promise<ViteDevServer>;

  /**
   * Publish the completed source revision through the viewer-owned transport.
   *
   * @evidence contracts/common.md#principled-implementation Completed source authority is announced only after the revision owner processes its changed-file batch.
   * @evidence contracts/common.md#clear-and-simple-design Publication borrows the viewer transport rather than coupling source hashing to application page refresh logic.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The announcement does not manufacture a revision before its changed dependency digests are computed.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies completed-source publication and the viewer-owned transport boundary.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This notification capability selects no revision hashing or transport broadcasting implementation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Publishing is a source-change effect; identical desired revisions do not certify that every candidate loaded the same code.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The transport owner retains listeners and connections; this callback transfers no network handle.
   */
  publishRevision: () => void;

  /** Source paths and selected storage owned by this server. */
  source: ReturnType<typeof createHumanViewerSource>;

  /** Public address and process-record identity. */
  instance: IHumanViewerInstance;

  /** Launcher owner, or null for a directly started server. */
  owner: number | null;

  /** Domain HTTP dispatcher installed before Vite middleware. */
  middleware: HumanViewerMiddleware;

  /**
   * Existing source-change publication, excluding the actual watcher binding.
   */
  watching: Omit<ISubscribeHumanViewerSourcesProps, "source" | "add" | "watch" | "browser">;

  /**
   * Return the current complete catalogue for source notifications.
   *
   * @evidence contracts/common.md#principled-implementation Source notifications consult the host's latest catalogue authority rather than a startup-time document snapshot.
   * @evidence contracts/common.md#clear-and-simple-design Catalogue ownership remains with the host while server startup borrows its current-state accessor.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The accessor does not present an old source inventory as current after source or admission changes.
   * @evidence contracts/common.md#meaningful-documentation The member documents current complete-catalogue access for source notification consumers.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This inventory capability implements no catalogue parsing or admission algorithm.
   * @evidence contracts/performance.md#reuse-equivalent-work The host shares its published catalogue between notifications until source/input/admission authority replaces it.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Reading the catalogue does not acquire displayed residents or source watcher handles.
   */
  inventory: () => IHumanViewerCatalogue;

  /**
   * Start this session's resident page through its existing recovery owner.
   *
   * @evidence contracts/common.md#principled-implementation Page opening uses the session's residency owner so renderer failure and replacement share the same actual browser lifecycle.
   * @evidence contracts/common.md#clear-and-simple-design Server startup requests page opening without reimplementing browser launch, listeners or generation readiness.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Opening a page is not treated as hardware-ready publication before actual generation and renderer checks.
   * @evidence contracts/common.md#meaningful-documentation The comment ties page acquisition to this session and the established recovery owner.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The open-page capability chooses no browser reuse or readiness-wait algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Page acquisition is session-specific; another server's ready page is not equivalent ownership.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The session's residency owner retains the opened browser/page and the paired closeRenderer capability must retire those resources.
   */
  openPage: () => Promise<void>;

  /** Resolves when the first actual page is ready. */
  firstReady: Promise<void>;

  /**
   * Return the page-reported renderer text after first readiness for the existing classification policy.
   *
   * @evidence contracts/common.md#principled-implementation Startup reads the resident page's unmasked renderer text or generic GL.RENDERER fallback after reported readiness and applies the existing judgeViewerRenderer policy.
   * @evidence contracts/common.md#clear-and-simple-design The startup owner borrows the text accessor and delegates classification to judgeViewerRenderer rather than performing another renderer query.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Launch flags and accepted generic renderer text do not independently prove the hardware device, visible model or working controls; those require actual observation.
   * @evidence contracts/common.md#meaningful-documentation The member states renderer-text timing, policy admission and the separate hardware/display observation limit.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This string accessor chooses no WebGL renderer query or hardware classification algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The observed renderer is metadata for this session and provides no reusable proof of another session's readiness.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Accessing renderer text acquires no GPU allocation and leaves the context owned by residency.
   */
  renderer: () => string;

  /**
   * Record the named startup stage with the startup owner's current timestamp and log.
   *
   * @evidence contracts/common.md#principled-implementation Startup transition reporting preserves the actual stage and entry time so health and logs describe current startup progress.
   * @evidence contracts/common.md#clear-and-simple-design The server calls one existing phase owner instead of maintaining separate timing and status records.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Phase labels reflect reached startup steps rather than fabricated completion after a fixed delay.
   * @evidence contracts/common.md#meaningful-documentation The member documents stage naming, timestamp recording and logging through the startup owner.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This stage-notification signature selects no clock or log-storage implementation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Recording a stage is a timestamped effect and cannot be shared solely because another transition has the same name.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A phase update retains only startup status and acquires no server or browser handle.
   */
  phase: (name: string) => void;

  /**
   * Publish acceptance under the reported-renderer policy and begin current-thumbnail maintenance; independent hardware observation remains separate.
   *
   * @evidence contracts/common.md#principled-implementation Ready publication follows reported page-generation readiness and the existing renderer-string predicate before thumbnail maintenance starts; independent hardware observation remains separate.
   * @evidence contracts/common.md#clear-and-simple-design The host's ready operation retains publication/warming ownership while server startup owns admission ordering.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts This callback cannot be used as evidence that listening alone proves renderer readiness.
   * @evidence contracts/common.md#meaningful-documentation The member documents post-admission ready publication and current-thumbnail maintenance.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The ready capability chooses no warm-document scheduling or thumbnail cache algorithm.
   * @evidence contracts/performance.md#reuse-equivalent-work Thumbnail maintenance reuses matching current keys and withdraws obsolete source passes; ready notification itself remains an owned effect.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Background warming and publication handles stay with their existing host owners, not this startup callback signature.
   */
  ready: () => void;

  /**
   * Await the session's acquired browser/page, numerical realm and source-event cleanup; source-service and Vite retirement are composed by the server starter.
   *
   * @evidence contracts/common.md#principled-implementation The supplied closure awaits this session's acquired browser/page, numerical realm and source-event cleanup; each actual host owner remains responsible for its completion and uncertainty.
   * @evidence contracts/common.md#clear-and-simple-design The application joins its source-event, numerical and residency owners in this closure; the server starter independently joins it with source-service and Vite retirement.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Cleanup does not kill unrelated browser sessions or infer ownership from a reused port number.
   * @evidence contracts/common.md#meaningful-documentation The comment defines awaited cleanup and its restriction to this session's acquired resources.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This teardown capability chooses no browser-close or observer-detachment implementation strategy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Equal configurations do not share renderer ownership; repeated-cleanup equivalence belongs to the residency owner.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The closure awaits its session owners on shutdown/startup failure and preserves failures without skipping siblings; public completion does not independently measure OS/GPU release.
   */
  closeRenderer: () => Promise<void>;
}
