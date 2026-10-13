import type { HumanResidentReply } from "./HumanResidentReply.js";
import type { IHumanResidentRequest } from "./IHumanResidentRequest.js";
import type { IHumanWorkerError } from "./IHumanWorkerError.js";
import type { IHumanWorkerMessage } from "./IHumanWorkerMessage.js";

/**
 * Native worker transport supplied to the resident numerical request owner.
 * Browser allocation and termination stay with the caller of this interface.
 *
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
