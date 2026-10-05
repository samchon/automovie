/// <reference lib="webworker" />
/**
 * The body editor owns one numerical worker until transport failure or page
 * teardown. It admits the shipped basis once, then evaluates correlated
 * preview and explicit export requests against that compiled evaluator.
 */
import type { IAutoMovieHumanBodyBasis } from "@automovie/human";

import type { ConnectedBodyRequest } from "./human/body/ConnectedBodyRequest";
import { connectedBodyTransfers } from "./human/body/connectedBodyTransfers";
import { createConnectedBodyRuntime } from "./human/body/connectedBodyRuntime";
import { readConnectedFaceAsset } from "./human/common/connectedAsset";
import { createHumanResidentHandler } from "./human/common/residentHandler";

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
