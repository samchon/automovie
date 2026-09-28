/// <reference lib="webworker" />
/**
 * The body editor owns one numerical worker until transport failure or page
 * teardown. It admits the shipped basis once, then evaluates correlated
 * preview and explicit export requests against that compiled evaluator.
 */
import type { IAutoMovieHumanBodyBasis } from "@automovie/human";

import { readConnectedFaceAsset } from "./human/connectedAsset";
import {
  type ConnectedBodyRequest,
  connectedBodyTransfers,
} from "./human/connectedBodyProtocol";
import { createConnectedBodyRuntime } from "./human/connectedBodyRuntime";
import { createHumanResidentHandler } from "./human/residentHandler";

const scope = self as unknown as DedicatedWorkerGlobalScope;
const prepared = readConnectedFaceAsset<IAutoMovieHumanBodyBasis>({
  read: () =>
    fetch(
      new URL(
        "../../../test/studies/human-body/connected-basis/basis.json.gz",
        import.meta.url,
      ),
    ),
}).then(createConnectedBodyRuntime);
const handle = createHumanResidentHandler({
  prepare: prepared,
  send: (reply) =>
    scope.postMessage(reply, {
      transfer: reply.success ? connectedBodyTransfers(reply.value) : [],
    }),
});
scope.onmessage = (
  event: MessageEvent<{ id: number; input: ConnectedBodyRequest }>,
) => {
  void handle(event.data);
};
