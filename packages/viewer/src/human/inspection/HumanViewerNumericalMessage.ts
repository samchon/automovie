import type { IHumanViewerNumericalProgress } from "./IHumanViewerNumericalProgress.js";
import type { IHumanViewerNumericalReady } from "./IHumanViewerNumericalReady.js";
import type { IHumanViewerNumericalReply } from "./IHumanViewerNumericalReply.js";
import type { IHumanViewerNumericalOpened } from "./IHumanViewerNumericalOpened.js";
import type { IHumanViewerNumericalPersistenceMessage } from "./IHumanViewerNumericalPersistenceMessage.js";
import type { IHumanViewerNumericalFailure } from "./IHumanViewerNumericalFailure.js";

/**
 * Numerical transport messages retain readiness, actual progress and results as distinct alternatives.
 */
export type HumanViewerNumericalMessage =
  | IHumanViewerNumericalOpened
  | IHumanViewerNumericalReady
  | IHumanViewerNumericalProgress
  | IHumanViewerNumericalPersistenceMessage
  | IHumanViewerNumericalFailure
  | IHumanViewerNumericalReply;
