/**
 * Keep one admitted basis evaluator in a worker. A preview packs transferable
 * geometry and measurements; export runs only on an explicit request. The last
 * evaluated document may be reused for export, while a different committed
 * document is evaluated independently of an in-flight draft.
 */
import { measureAutoMovieModelCrossings } from "@automovie/engine";
import {
  type IAutoMovieHumanBodyBasis,
  createHumanBodyBasisBuilder,
  exportHumanBody,
  parseHumanBodyBasisDocument,
  segmentHumanBodyModel,
} from "@automovie/human";

import { packConnectedBodyModel } from "./connectedBodyGeometry";
import type {
  ConnectedBodyRequest,
  ConnectedBodyResult,
} from "./connectedBodyProtocol";

/** Compile the basis once and evaluate all later body requests against it. */
export function createConnectedBodyRuntime(basis: IAutoMovieHumanBodyBasis) {
  const evaluate = createHumanBodyBasisBuilder(basis);
  let last:
    | { document: string; built: ReturnType<typeof evaluate> }
    | undefined;
  return async (
    request: ConnectedBodyRequest,
  ): Promise<ConnectedBodyResult> => {
    // Canonical parsing is required even when the text matches the cache: a
    // caller cannot bypass document admission by reusing a previous string.
    const document = parseHumanBodyBasisDocument(request.document);
    const built =
      last?.document === request.document ? last.built : evaluate(document);
    last = { document: request.document, built };
    if (request.operation === "export") {
      const { glb } = await exportHumanBody(built.model);
      return { operation: "export", glb };
    }
    const model = packConnectedBodyModel(built.model);
    return {
      operation: "preview",
      model,
      crossings: request.measure
        ? measureAutoMovieModelCrossings(
            segmentHumanBodyModel(basis, built).model,
          )
        : null,
      extras: { bones: built.bones, landmarks: built.landmarks },
    };
  };
}
