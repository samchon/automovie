import type { HumanResidentReply } from "./HumanResidentReply";
import type { IHumanResidentRequest } from "./IHumanResidentRequest";
import type { IHumanWorkerError } from "./IHumanWorkerError";
import type { IHumanWorkerMessage } from "./IHumanWorkerMessage";

/**
 * Native worker transport supplied to the resident numerical request owner.
 * Browser allocation and termination stay with the caller of this interface.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Carries correlated results and connection failures without publishing them.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Separates browser lifecycle effects from numerical request ownership.
 * @author Samchon
 */
export interface HumanResidentPort<Input, Output> {
  /** Current correlated response callback; null detaches the consumer. */
  onmessage:
    | ((event: IHumanWorkerMessage<HumanResidentReply<Output>>) => void)
    | null;

  /** A normalized transport failure invalidates requests of this connection. */
  onerror: ((event: IHumanWorkerError) => void) | null;

  /** Send one immutable numerical request envelope. */
  postMessage: (request: IHumanResidentRequest<Input>) => void;

  /** Stop this connection after a transport failure or final disposal. */
  terminate: () => void;
}
