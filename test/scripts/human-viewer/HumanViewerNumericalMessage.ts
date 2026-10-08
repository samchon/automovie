import type { IHumanViewerNumericalProgress } from "./IHumanViewerNumericalProgress";
import type { IHumanViewerNumericalReady } from "./IHumanViewerNumericalReady";
import type { IHumanViewerNumericalReply } from "./IHumanViewerNumericalReply";
import type { IHumanViewerNumericalOpened } from "./IHumanViewerNumericalOpened";
import type { IHumanViewerNumericalPersistenceMessage } from "./IHumanViewerNumericalPersistenceMessage";
import type { IHumanViewerNumericalFailure } from "./IHumanViewerNumericalFailure";

/** Numerical transport messages retain readiness, actual progress and results as distinct alternatives. */
export type HumanViewerNumericalMessage =
  | IHumanViewerNumericalOpened
  | IHumanViewerNumericalReady
  | IHumanViewerNumericalProgress
  | IHumanViewerNumericalPersistenceMessage
  | IHumanViewerNumericalFailure
  | IHumanViewerNumericalReply;
