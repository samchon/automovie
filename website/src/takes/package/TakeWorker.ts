// The take worker's entry, started by `TakeClient`: each message is one
// request, answered by `TakeCompute` with the request's id. The packages are
// imported here alone, so planning and posing never block the page.
import type { ITakeRequest } from "../structures/ITakeRequest";
import type { ITakeResponse } from "../structures/ITakeResponse";
import { TakeCompute } from "./TakeCompute";

/** The worker's global scope, as far as this entry uses it. */
interface IScope {
  /** Called with each request. */
  onmessage: ((event: MessageEvent<ITakeRequest>) => void) | null;

  /** Send an answer, moving the buffers it names instead of copying them. */
  postMessage(message: ITakeResponse, transfer: Transferable[]): void;
}

const scope: IScope = self as unknown as IScope;
scope.onmessage = (event: MessageEvent<ITakeRequest>): void => {
  const answered: { response: ITakeResponse; transfer: ArrayBuffer[] } =
    TakeCompute.answer(event.data);
  scope.postMessage(answered.response, answered.transfer);
};
