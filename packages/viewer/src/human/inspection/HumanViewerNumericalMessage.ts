import type { IHumanViewerNumericalProgress } from "./IHumanViewerNumericalProgress.js";
import type { IHumanViewerNumericalReady } from "./IHumanViewerNumericalReady.js";
import type { IHumanViewerNumericalReply } from "./IHumanViewerNumericalReply.js";
import type { IHumanViewerNumericalOpened } from "./IHumanViewerNumericalOpened.js";
import type { IHumanViewerNumericalPersistenceMessage } from "./IHumanViewerNumericalPersistenceMessage.js";
import type { IHumanViewerNumericalFailure } from "./IHumanViewerNumericalFailure.js";

/**
 * Numerical transport messages retain readiness, actual progress and results as distinct alternatives.
 *
 * @evidence contracts/common.md#principled-implementation Opened, ready, progress, persistence, failure and correlated reply records remain distinct transport alternatives, as createHumanViewerNumericalPort dispatches by their tags before matching request ids.
 * @evidence contracts/common.md#clear-and-simple-design Combines existing message identities without weakening their fields into one optional record; startup readiness, observed work and request settlement retain separate consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No fabricated progress or elapsed-time completion is introduced; an opened message is not ready and a progress message does not settle a pending result.
 * @evidence contracts/common.md#meaningful-documentation States the numerical lifecycle alternatives; payload admission, source identity and actual success remain the endpoint/port's checks rather than guarantees of this union.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The union erases at runtime; message parsing and pending-map lookup execute in the numerical transport owners.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Correlated replies and progress belong to current request/realm identities, so identical message shapes alone authorize no cross-request cache hit.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Message records borrow their payloads during transport; endpoint queues, persistence work and pending result maps own retention and cancellation, without a population bound supplied by this alias.
 */
export type HumanViewerNumericalMessage =
  | IHumanViewerNumericalOpened
  | IHumanViewerNumericalReady
  | IHumanViewerNumericalProgress
  | IHumanViewerNumericalPersistenceMessage
  | IHumanViewerNumericalFailure
  | IHumanViewerNumericalReply;
