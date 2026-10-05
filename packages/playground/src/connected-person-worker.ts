/// <reference lib="webworker" />
/**
 * Resident worker of the connected person editor. It reads the published
 * person generation's head and body files once, joins them in the product
 * person runtime and answers the body editor's request protocol (preview and
 * export) for person documents.
 */
import type {
  IAutoMovieHumanPersonBodyView,
  IAutoMovieHumanPersonHeadView,
} from "@automovie/human";

import type { ConnectedBodyRequest } from "./human/body/ConnectedBodyRequest";
import { connectedBodyTransfers } from "./human/body/connectedBodyTransfers";
import { readConnectedFaceAsset } from "./human/common/connectedAsset";
import { createHumanResidentHandler } from "./human/common/residentHandler";
import { createConnectedPersonRuntime } from "./human/person/createConnectedPersonRuntime";

const scope = self as unknown as DedicatedWorkerGlobalScope;
// Literal asset URLs, which the bundler resolves relative to this module.
const asset = <T,>(url: URL): Promise<T> => readConnectedFaceAsset<T>({ read: () => fetch(url) });
const prepared = Promise.all([
  asset<IAutoMovieHumanPersonHeadView>(new URL("../../../test/studies/human-person/generation/head.json.gz", import.meta.url)),
  asset<IAutoMovieHumanPersonBodyView>(new URL("../../../test/studies/human-person/generation/body.json.gz", import.meta.url)),
]).then(([head, body]) => createConnectedPersonRuntime([head, body]));
const handle = createHumanResidentHandler({
  prepare: prepared,
  send: (reply) =>
    scope.postMessage(reply, {
      transfer: reply.success ? connectedBodyTransfers(reply.value) : [],
    }),
});
scope.onmessage = (
  event: MessageEvent<IConnectedPersonWorkerMessage>,
) => {
  void handle(event.data);
};

/** One request the editor posts to this worker. */
interface IConnectedPersonWorkerMessage {
  /** Correlates the reply. */
  id: number;

  /** The body-protocol request carrying a person document. */
  input: ConnectedBodyRequest;
}
