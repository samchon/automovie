import type { IConnectedPersonBodySolveMessage } from "./IConnectedPersonBodySolveMessage";
import type { IConnectedPersonFaceReadMessage } from "./IConnectedPersonFaceReadMessage";
import type { IConnectedPersonFaceSolveMessage } from "./IConnectedPersonFaceSolveMessage";
import type { IConnectedPersonHeadReadMessage } from "./IConnectedPersonHeadReadMessage";
import type { IConnectedPersonHeadSolveMessage } from "./IConnectedPersonHeadSolveMessage";
import type { IConnectedPersonReadMessage } from "./IConnectedPersonReadMessage";
import type { IConnectedPersonSimpleExpandMessage } from "./IConnectedPersonSimpleExpandMessage";
import type { IConnectedPersonSimpleProjectMessage } from "./IConnectedPersonSimpleProjectMessage";
import type { IConnectedPersonSolveMessage } from "./IConnectedPersonSolveMessage";

/**
 * One request the person editor posts to its measurement worker,
 * discriminated by `kind`.
 *
 * @author Samchon
 */
export type IConnectedPersonMeasureMessage =
  | IConnectedPersonBodySolveMessage
  | IConnectedPersonReadMessage
  | IConnectedPersonSolveMessage
  | IConnectedPersonHeadReadMessage
  | IConnectedPersonHeadSolveMessage
  | IConnectedPersonFaceReadMessage
  | IConnectedPersonFaceSolveMessage
  | IConnectedPersonSimpleExpandMessage
  | IConnectedPersonSimpleProjectMessage;
