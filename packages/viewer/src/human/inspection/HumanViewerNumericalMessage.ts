import type { IHumanViewerNumericalProgress } from "./IHumanViewerNumericalProgress.js";
import type { IHumanViewerNumericalReady } from "./IHumanViewerNumericalReady.js";
import type { IHumanViewerNumericalReply } from "./IHumanViewerNumericalReply.js";
import type { IHumanViewerNumericalOpened } from "./IHumanViewerNumericalOpened.js";
import type { IHumanViewerNumericalPersistenceMessage } from "./IHumanViewerNumericalPersistenceMessage.js";
import type { IHumanViewerNumericalFailure } from "./IHumanViewerNumericalFailure.js";

/**
 * Numerical transport messages retain readiness, actual progress and results as distinct alternatives.
 *
 * @evidence contracts/common.md#principled-implementation A discriminated union preserves owned-session opening, checked readiness, progress, persistence, process failure and original numerical replies.
 * @evidence contracts/common.md#clear-and-simple-design Each wire alternative keeps its fields with the operation that produces it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Readiness and persistence notifications cannot supply fabricated numerical models through their separate message shapes.
 * @evidence contracts/common.md#meaningful-documentation The union distinguishes transport lifecycle notifications from completed product results.
 */
export type HumanViewerNumericalMessage =
  | IHumanViewerNumericalOpened
  | IHumanViewerNumericalReady
  | IHumanViewerNumericalProgress
  | IHumanViewerNumericalPersistenceMessage
  | IHumanViewerNumericalFailure
  | IHumanViewerNumericalReply;
