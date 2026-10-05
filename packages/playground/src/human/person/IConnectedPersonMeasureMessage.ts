import type { IConnectedPersonBodySolveMessage } from "./IConnectedPersonBodySolveMessage";
import type { IConnectedPersonFaceReadMessage } from "./IConnectedPersonFaceReadMessage";
import type { IConnectedPersonFaceSolveMessage } from "./IConnectedPersonFaceSolveMessage";
import type { IConnectedPersonHeadReadMessage } from "./IConnectedPersonHeadReadMessage";
import type { IConnectedPersonHeadSolveMessage } from "./IConnectedPersonHeadSolveMessage";
import type { IConnectedPersonReadMessage } from "./IConnectedPersonReadMessage";
import type { IConnectedPersonSolveMessage } from "./IConnectedPersonSolveMessage";

/**
 * One request the person editor posts to its measurement worker,
 * discriminated by `kind`.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-measurements Carries one read or solve request of the person's measurement worker.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-measurements Discriminates the measurement worker's requests by kind.
 * @author Samchon
 */
export type IConnectedPersonMeasureMessage =
  | IConnectedPersonBodySolveMessage
  | IConnectedPersonReadMessage
  | IConnectedPersonSolveMessage
  | IConnectedPersonHeadReadMessage
  | IConnectedPersonHeadSolveMessage
  | IConnectedPersonFaceReadMessage
  | IConnectedPersonFaceSolveMessage;
