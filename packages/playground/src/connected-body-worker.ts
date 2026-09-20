/// <reference lib="webworker" />
/**
 * A disposable worker loads the shipped body basis, builds one document
 * through the package builder and hands back the static GLB with the posed
 * bone transforms the page needs to seat the face on the head.
 */
import { measureAutoMovieModelCrossings } from "@automovie/engine";
import {
  type IAutoMovieHumanBodyBasis,
  createHumanBodyBasisBuilder,
  exportHumanBody,
  parseHumanBodyBasisDocument,
  segmentHumanBodyModel,
} from "@automovie/human";

import { readConnectedFaceAsset } from "./human/connectedAsset";
import { createHumanFaceWorkerHandler } from "./human/workerHandler";

const scope = self as unknown as DedicatedWorkerGlobalScope;
const prepared = readConnectedFaceAsset<IAutoMovieHumanBodyBasis>({
  read: () =>
    fetch(
      new URL(
        "../../../test/studies/human-body/connected-basis/basis.json.gz",
        import.meta.url,
      ),
    ),
  decode: (bytes) =>
    new Response(
      new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip")),
    ).text(),
}).then((basis) => {
  const evaluate = createHumanBodyBasisBuilder(basis);
  return createHumanFaceWorkerHandler({
    parse: parseHumanBodyBasisDocument,
    build: (document) => {
      const built = evaluate(document);
      return { ...built, parts: built.model.parts };
    },
    // The contact check reads the same dominant-bone partition the shipped
    // census uses, so a pair the editor reports is a pair the census names.
    measure: (built) =>
      measureAutoMovieModelCrossings(segmentHumanBodyModel(basis, built).model),
    describe: (built) => ({ bones: built.bones, landmarks: built.landmarks }),
    export: (built) => exportHumanBody(built.model),
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
