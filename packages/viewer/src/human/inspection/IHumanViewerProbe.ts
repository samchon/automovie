import type { IHumanShotHealth } from "./IHumanShotHealth.js";

/**
 * One `/health` probe of a viewer port.
 *
 * @evidence contracts/common.md#principled-implementation Keeps an answering, an absent and an unanswered port apart.
 * @evidence contracts/common.md#meaningful-documentation States each health value's meaning.
 *
 * @evidence contracts/common.md#clear-and-simple-design The health value preserves answered, refused and incomplete states with the probe's failure text.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unanswered listener cannot be treated as an absent port that permits a duplicate server.
 *
 * @evidence requirements/operations-and-recovery/concurrent-runs-and-locking.md#operations-lock-scope-owner Keeps an answering, an absent and an unanswered port apart.
 * @evidence specifications/execution-and-recovery/concurrent-ownership-and-locking.md#execution-claim-scope-owner An unanswered listener cannot be treated as an absent port that permits a duplicate server.
 *
 * @author Samchon
 */
export interface IHumanViewerProbe {
  /**
   * The answer; null when the connection was refused, undefined when nothing complete answered.
   *
   * @evidence requirements/operations-and-recovery/concurrent-runs-and-locking.md#operations-lock-scope-owner Keeps answered, connection-refused and incomplete-response states distinct before ownership or readiness judgement.
   * @evidence specifications/execution-and-recovery/concurrent-ownership-and-locking.md#execution-claim-scope-owner Keeps answered, connection-refused and incomplete-response states distinct before ownership or readiness judgement.
   */
  health: IHumanShotHealth | null | undefined;

  /**
   * Why no complete answer arrived, empty when one did.
   *
   * @evidence requirements/operations-and-recovery/concurrent-runs-and-locking.md#operations-lock-scope-owner Preserves the cause of an incomplete health observation rather than treating it as a proven absent process.
   * @evidence specifications/execution-and-recovery/concurrent-ownership-and-locking.md#execution-claim-scope-owner Preserves the cause of an incomplete health observation rather than treating it as a proven absent process.
   */
  failure: string;
}
