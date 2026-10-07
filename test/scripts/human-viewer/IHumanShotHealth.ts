/**
 * The members of the viewer's `/health` answer the `human-shot` client reads.
 *
 * @evidence contracts/common.md#principled-implementation The service identity separates this viewer from another program on the port.
 * @evidence contracts/common.md#meaningful-documentation Names each member the client depends on.
 * @author Samchon
 */
export interface IHumanShotHealth {
  /** Always `automovie-human-viewer` for this viewer. */
  service: string;

  /** Wire generation of this resident backend; absent on older incompatible servers. */
  protocol?: string;

  /** Resolved mutable storage; older viewers did not report this member. */
  storage?: string;

  /** Public-port owner PID; health.serverPid separately names the server child. */
  pid: number;

  /** Current source revision. */
  revision: string;

  /** Renderer string of the GPU page. */
  renderer: string;

  /** Whether the server can draw. */
  ready: boolean;

  /** Recent page and source errors. */
  errors: string[];
}
