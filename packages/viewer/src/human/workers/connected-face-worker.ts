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
import type { ConnectedFaceResult } from "@automovie/human/face/runtime/ConnectedFaceResult";
import { createConnectedFaceRuntime } from "@automovie/human/face/runtime/createConnectedFaceRuntime";
import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";
import type { HumanResidentReply } from "@automovie/viewer/human/common/HumanResidentReply";
import type { IHumanResidentRequest } from "@automovie/viewer/human/common/IHumanResidentRequest";
import { readConnectedFaceAsset } from "@automovie/viewer/human/common/assets/readConnectedFaceAsset";

import { createHumanResidentHandler } from "@automovie/viewer/human/common/createHumanResidentHandler";
import { readConnectedFaceSourceUrl } from "@automovie/viewer/human/face/readConnectedFaceSourceUrl";

const scope: DedicatedWorkerGlobalScope =
  self as unknown as DedicatedWorkerGlobalScope;
const prepared: Promise<
  (request: ConnectedFaceRequest) => Promise<ConnectedFaceResult>
> = Promise.resolve()
  .then((): string => readConnectedFaceSourceUrl(scope.name, location.href))
  .then(
    (source: string): Promise<IAutoMovieHumanFaceBasis> =>
      readConnectedFaceAsset({ read: (): Promise<Response> => fetch(source) }),
  )
  .then(
    (
      basis: IAutoMovieHumanFaceBasis,
    ): ((request: ConnectedFaceRequest) => Promise<ConnectedFaceResult>) =>
      createConnectedFaceRuntime({ basis }),
  );
const handle: (
  request: IHumanResidentRequest<ConnectedFaceRequest>,
) => Promise<void> = createHumanResidentHandler({
  prepare: prepared,
  send: (reply: HumanResidentReply<ConnectedFaceResult>): void => {
    const transfer: ArrayBuffer[] =
      reply.success && reply.value.operation === "export"
        ? [reply.value.glb.buffer]
        : [];
    scope.postMessage(reply, { transfer });
  },
});
scope.onmessage = (
  event: MessageEvent<IHumanResidentRequest<ConnectedFaceRequest>>,
): void => {
  void handle(event.data);
};
