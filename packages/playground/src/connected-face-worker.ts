/// <reference lib="webworker" />
/**
 * Prepare the application's one shared basis once per resident worker. A literal
 * module-relative URL gives the bundler that exact asset dependency; an arbitrary
 * filename template would also package historical personal data in the directory.
 * Numerical documents never select an external resource. The asset is decoded
 * by content, because a server may hand over the gzip bytes or, with a
 * `Content-Encoding` header, bytes the browser has already inflated.
 */
import { readConnectedFaceAsset } from "./human/common/connectedAsset";
import {
  type ConnectedFaceRequest,
  createConnectedFaceRuntime,
} from "./human/common/connectedRuntime";
import { createHumanResidentHandler } from "./human/common/residentHandler";

const scope = self as unknown as DedicatedWorkerGlobalScope;
const prepared = readConnectedFaceAsset({
  read: () =>
    fetch(
      new URL(
        "../../../test/studies/human-face/connected-basis/global-face/basis.json.gz",
        import.meta.url,
      ),
    ),
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
  event: MessageEvent<{ id: number; input: ConnectedFaceRequest }>,
) => {
  void handle(event.data);
};
