/// <reference lib="webworker" />
/**
 * Prepare the application's one shared basis once per resident worker. A literal
 * module-relative URL gives the bundler that exact asset dependency; an arbitrary
 * filename template would also package historical personal data in the directory.
 * Numerical documents never select an external resource. The asset is decoded
 * by content, because a server may hand over the gzip bytes or, with a
 * `Content-Encoding` header, bytes the browser has already inflated.
 */
import type { ConnectedFaceRequest } from "@automovie/human/face/runtime/ConnectedFaceRequest";
import type { IHumanResidentRequest } from "@automovie/viewer/human/common/IHumanResidentRequest";
import { readConnectedFaceAsset } from "@automovie/viewer/human/common/assets/readConnectedFaceAsset";
import { createConnectedFaceRuntime } from "@automovie/human/face/runtime/createConnectedFaceRuntime";
import { createHumanResidentHandler } from "./human/common/residentHandler";
import faceBasisUrl from "erased-data";

const scope = self as unknown as DedicatedWorkerGlobalScope;
const prepared = readConnectedFaceAsset({
  read: () =>
    fetch(faceBasisUrl),
}).then((basis) => createConnectedFaceRuntime({ basis }));
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
