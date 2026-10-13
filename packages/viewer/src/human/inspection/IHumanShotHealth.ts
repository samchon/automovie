/**
 * The members of the viewer's `/health` answer the `human-shot` client reads.
 *
 * This wire projection contributes answering-listener, source, device, availability and cause facts. Its ready flag is independent of displayed-model and control acceptance; it does not implement job ETA or credential redaction.
 *
 * @author Samchon
 */
export interface IHumanShotHealth {
  /** Always `automovie-human-viewer` for this viewer. */
  service: string;

  /**
   * Wire generation of this resident backend; absent on older incompatible servers.
   */
  protocol?: string;

  /** Resolved mutable storage; older viewers did not report this member. */
  storage?: string;

  /**
   * Public-port owner PID; health.serverPid separately names the server child.
   */
  pid: number;

  /** Current source revision. */
  revision: string;

  /** Renderer string of the GPU page. */
  renderer: string;

  /** Whether the server can draw. */
  ready: boolean;

  /** Recent page and source errors. */
  errors: string[];

  /** Explicit startup or source failure reported by the answering server. */
  sourceError?: string | null;
}
