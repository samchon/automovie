/// <reference lib="webworker" />
/**
 * Prepare the page-selected basis once per resident worker. The repository
 * bundles no basis: the page passes the caller's `faceSource` URL in the
 * worker name, and a missing selection refuses before any fetch. Numerical
 * documents never select an external resource. The asset is decoded
 * by content, because a server may hand over the gzip bytes or, with a
 * `Content-Encoding` header, bytes the browser has already inflated.
 */
import type { ConnectedFaceRequest } from "@automovie/human/face/runtime/ConnectedFaceRequest";
import type { IHumanResidentRequest } from "@automovie/viewer/human/common/IHumanResidentRequest";
import { readConnectedFaceAsset } from "@automovie/viewer/human/common/assets/readConnectedFaceAsset";
import { createConnectedFaceRuntime } from "@automovie/human/face/runtime/createConnectedFaceRuntime";
import { createHumanResidentHandler } from "./human/common/residentHandler";
import { readConnectedFaceSourceUrl } from "./human/face/readConnectedFaceSourceUrl";

const scope = self as unknown as DedicatedWorkerGlobalScope;
const prepared = Promise.resolve()
  .then(() => readConnectedFaceSourceUrl(scope.name, location.href))
  .then((source) => readConnectedFaceAsset({ read: () => fetch(source) }))
  .then((basis) => createConnectedFaceRuntime({ basis }));
const handle = createHumanResidentHandler({
  prepare: prepared,
  send: (reply) => {
    const transfer =
      reply.success && reply.value.operation === "export"
        ? [reply.value.glb.buffer]
        : [];
    scope.postMessage(reply, { transfer });
  },
});
scope.onmessage = (
  event: MessageEvent<IHumanResidentRequest<ConnectedFaceRequest>>,
) => {
  void handle(event.data);
};
