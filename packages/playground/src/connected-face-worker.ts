/// <reference lib="webworker" />
/** A disposable worker loads the selected basis and uses the shared request owner. */
import { measureAutoMovieModelCrossings } from "@automovie/engine";
import {
  createHumanFaceBasisBuilder,
  exportHumanFace,
  parseHumanFaceBasisDocument,
} from "@automovie/human";

import { readConnectedFaceAsset } from "./human/connectedAsset";
import { createHumanFaceWorkerHandler } from "./human/workerHandler";

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
}).then((basis) =>
  createHumanFaceWorkerHandler({
    parse: parseHumanFaceBasisDocument,
    build: createHumanFaceBasisBuilder(basis),
    measure: measureAutoMovieModelCrossings,
    export: exportHumanFace,
    send: (reply, transfer) => scope.postMessage(reply, { transfer }),
  }),
);
scope.onmessage = async (
  event: MessageEvent<{ document: string; measure?: boolean }>,
) => {
  try {
    await (
      await prepared
    )(event.data.document, event.data.measure === true);
  } catch (error) {
    scope.postMessage({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
