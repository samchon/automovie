/**
 * The members of the viewer's `/health` answer the `human-shot` client reads.  This wire projection contributes answering-listener, source, device, availability and cause facts. Its ready flag is independent of displayed-model and control acceptance; it does not implement job ETA or credential redaction.
 *
 * @evidence contracts/common.md#principled-implementation Projects answering service/protocol/storage/PID and current source/device/availability facts for probeHumanViewer and client control decisions.
 * @evidence contracts/common.md#clear-and-simple-design Keeps the client wire subset separate from the larger server health payload without loading numerical Human code.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Service/protocol checks precede control; ready and renderer text do not certify displayed models, working controls or independent hardware observation.
 * @evidence contracts/common.md#meaningful-documentation States legacy optional protocol/storage fields, public-port PID and independent readiness; sourceError carries reported cause rather than a full diagnostic.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface does not probe; fetch/text/JSON cost and timeout belong to probeHumanViewer.
 * @evidence contracts/performance.md#reuse-equivalent-work Each client probe reads a fresh payload; a previous ready flag cannot authorize a changed listener or source generation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Health values and error strings live with the caller's observation without a payload-size cap here; native process ownership stays separate.
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

  /** Whether nonempty ready-revision and renderer strings were reported; not independent drawing proof. */
  ready: boolean;

  /** Recent page and source errors. */
  errors: string[];

  /** Explicit startup or source failure reported by the answering server. */
  sourceError?: string | null;
}
