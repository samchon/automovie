/// <reference lib="webworker" />
/** A disposable worker loads the selected basis and uses the shared request owner. */
import { measureAutoMovieModelCrossings } from "@automovie/engine";
import {
  appendHumanFaceGroom,
  createHumanFaceBasisBuilder,
  exportHumanFace,
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceGroom,
  parseHumanFaceBasisDocument,
} from "@automovie/human";

import { readConnectedFaceAsset } from "./human/connectedAsset";
import { createHumanFaceWorkerHandler } from "./human/workerHandler";

const scope = self as unknown as DedicatedWorkerGlobalScope;
const gzipped = <Payload,>(name: string) =>
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
]).then(([basis, grooms]) => {
  const evaluate = createHumanFaceBasisBuilder(basis);
  return createHumanFaceWorkerHandler({
    parse: parseHumanFaceBasisDocument,
    // A connected basis has no hair surface, so a face is bald until its
    // document names a groom. An unknown name refuses rather than quietly
    // building the same bald head, which would look like a groom that failed
    // to render instead of one this build does not carry.
    build: (document) => {
      const model = evaluate(document);
      if (document.hair === undefined || document.hair === null) return model;
      const groom = grooms[document.hair];
      if (groom === undefined)
        throw new Error(
          "This build does not carry the groom this face names: " +
            document.hair,
        );
      return appendHumanFaceGroom({ model, groom });
    },
    measure: measureAutoMovieModelCrossings,
    export: exportHumanFace,
    send: (reply, transfer) => scope.postMessage(reply, { transfer }),
  });
});
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
