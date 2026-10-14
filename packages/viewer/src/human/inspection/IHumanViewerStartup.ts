/**
 * What a starting server is doing, as `/health` reports it. The ready phase follows the first reported bridge/renderer readiness; it does not independently establish a drawn model or physical hardware.
 *
 * @evidence contracts/common.md#principled-implementation A phase label and ISO start time describe server startup progress; the ready phase records the first reported bridge/renderer readiness rather than an independent model observation.
 * @evidence contracts/common.md#clear-and-simple-design The health-facing record contains progress only, leaving transition logging with createHumanViewerStartupPhase.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The startup record does not infer drawable readiness from listening on a port or completing an unrelated build.
 * @evidence contracts/common.md#meaningful-documentation Documentation gives the step's start-time format and the ready phase's first-generation meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The startup value chooses no readiness probe, scheduling or transition algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Phase values are current observations rather than cached results reusable across server instances.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Two status strings retain no startup tasks or browser resources; their owners maintain the actual lifecycle.
 *
 * @author Samchon
 */
export interface IHumanViewerStartup {
  /** The current startup step. */
  phase: string;

  /** ISO time the step began. */
  since: string;
}
