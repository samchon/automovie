/**
 * The members of the viewer's `/health` answer the `human-shot` client reads.
 *
 * This wire projection contributes answering-listener, source, device, availability and cause facts. Its ready flag is independent of displayed-model and control acceptance; it does not implement job ETA or credential redaction.
 *
 * @evidence contracts/common.md#principled-implementation The service identity separates this viewer from another program on the port.
 * @evidence contracts/common.md#meaningful-documentation Names each member the client depends on.
 *
 * @evidence contracts/common.md#clear-and-simple-design The client projects only the service, process, revision, readiness and error facts its commands consume.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Protocol and storage are optional to describe actual older replies; absence does not manufacture compatibility or readiness.
 *
 * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-progress-remaining-work The service identity separates this viewer from another program on the port.
 * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-progress-snapshot Protocol and storage are optional to describe actual older replies; absence does not manufacture compatibility or readiness.
 *
 * @author Samchon
 */
export interface IHumanShotHealth {
  /**
   * Always `automovie-human-viewer` for this viewer.
   *
   * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation Identifies an answering listener as the Human viewer before any control action uses its other facts.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform Identifies an answering listener as the Human viewer before any control action uses its other facts.
   */
  service: string;

  /**
   * Wire generation of this resident backend; absent on older incompatible servers.
   *
   * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation Preserves the answering server's actual wire generation; omission describes an older incompatible reply.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform Preserves the answering server's actual wire generation; omission describes an older incompatible reply.
   */
  protocol?: string;

  /**
   * Resolved mutable storage; older viewers did not report this member.
   *
   * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation Reports the answering server's resolved mutable storage so callers can distinguish another instance's ownership.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform Reports the answering server's resolved mutable storage so callers can distinguish another instance's ownership.
   */
  storage?: string;

  /**
   * Public-port owner PID; health.serverPid separately names the server child.
   *
   * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation Names the actual public-port owner separately from the child server process.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform Names the actual public-port owner separately from the child server process.
   */
  pid: number;

  /**
   * Current source revision.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-current-stale Retains the source identity reported by the answering service rather than deriving it from uptime.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Retains the source identity reported by the answering service rather than deriving it from uptime.
   */
  revision: string;

  /**
   * Renderer string of the GPU page.
   *
   * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-runtime-identity Reports the GPU page's actual device string independently of HTTP availability.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-capture-runtime-identity Reports the GPU page's actual device string independently of HTTP availability.
   */
  renderer: string;

  /**
   * Whether the server can draw.
   *
   * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-progress-remaining-work Reports current drawing availability while source freshness and actual displayed controls remain separate evidence.
   * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-progress-snapshot Reports current drawing availability while source freshness and actual displayed controls remain separate evidence.
   */
  ready: boolean;

  /**
   * Recent page and source errors.
   *
   * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-failure-diagnostic Preserves observed page and source failures instead of treating an answering service as error-free.
   * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-failure-observation Preserves observed page and source failures instead of treating an answering service as error-free.
   */
  errors: string[];

  /**
   * Explicit startup or source failure reported by the answering server.
   *
   * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-failure-diagnostic Keeps an explicit startup/source cause nullable when none was reported.
   * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-failure-observation Keeps an explicit startup/source cause nullable when none was reported.
   */
  sourceError?: string | null;
}
