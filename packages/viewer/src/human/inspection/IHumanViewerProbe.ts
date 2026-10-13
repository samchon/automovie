import type { IHumanShotHealth } from "./IHumanShotHealth.js";

/**
 * One `/health` probe of a viewer port.
 *
 * @evidence contracts/common.md#principled-implementation Represents one existing client health observation: answering owned payload, connection-refused absence or incomplete/unanswered transport.
 * @evidence contracts/common.md#clear-and-simple-design Separates null absence from undefined timeout/reset/body failure so control cannot confuse silence with a free port.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only answering service/protocol/storage checks authorize owned health; accepted silence cannot justify starting over or killing a listener.
 * @evidence contracts/common.md#meaningful-documentation Documents tri-state health and empty failure on complete answer, preserving named transport/JSON cause otherwise.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The shape performs no probe; its producer fetches/parses response bytes under the supplied one-attempt timeout.
 * @evidence contracts/performance.md#reuse-equivalent-work Each probe observes current listener state; an earlier owned ready payload is not equivalent after process/source changes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller retains one result/error text without native process ownership; the probe owns only transient fetch/timeout state.
 *
 * @author Samchon
 */
export interface IHumanViewerProbe {
  /**
   * The answer; null when the connection was refused, undefined when nothing complete answered.
   */
  health: IHumanShotHealth | null | undefined;

  /** Why no complete answer arrived, empty when one did. */
  failure: string;
}
