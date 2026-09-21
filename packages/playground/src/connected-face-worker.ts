/// <reference lib="webworker" />
/** A resident worker prepares the shared numerical resources once per page. */
import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceGroom,
} from "@automovie/human";

import { readConnectedFaceAsset } from "./human/connectedAsset";
import {
  type ConnectedFaceRequest,
  createConnectedFaceRuntime,
} from "./human/connectedRuntime";
import { createHumanResidentHandler } from "./human/residentHandler";

const scope = self as unknown as DedicatedWorkerGlobalScope;
const gzipped = <Payload>(name: string) =>
  readConnectedFaceAsset<Payload>({
    read: () =>
      fetch(
        new URL(
          `../../../test/studies/human-face/connected-basis/global-face/${name}`,
          import.meta.url,
        ),
      ),
    decode: (bytes) =>
      new Response(
        new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip")),
      ).text(),
  });
const prepared = Promise.all([
  gzipped<IAutoMovieHumanFaceBasis>("basis.json.gz"),
  gzipped<Record<string, IAutoMovieHumanFaceGroom>>("grooms.json.gz"),
]).then(([basis, grooms]) => createConnectedFaceRuntime({ basis, grooms }));
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
