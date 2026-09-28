/// <reference lib="webworker" />
/**
 * Prepare the application's one shared basis once per resident worker. A literal
 * module-relative URL gives the bundler that exact asset dependency; an arbitrary
 * filename template would also package historical personal data in the directory.
 * Numerical documents never select an external resource.
 */
import { readConnectedFaceAsset } from "./human/connectedAsset";
import {
  type ConnectedFaceRequest,
  createConnectedFaceRuntime,
} from "./human/connectedRuntime";
import { createHumanResidentHandler } from "./human/residentHandler";

const scope = self as unknown as DedicatedWorkerGlobalScope;
const prepared = readConnectedFaceAsset({
  read: () =>
    fetch(
      new URL(
        "../../../test/studies/human-face/connected-basis/global-face/basis.json.gz",
        import.meta.url,
      ),
    ),
  decode: (bytes) =>
    new Response(
      new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip")),
    ).text(),
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
