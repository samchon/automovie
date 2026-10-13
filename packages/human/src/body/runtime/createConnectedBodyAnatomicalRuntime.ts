import { createHumanBodyAnatomicalInspection } from "../anatomy/articulation/createHumanBodyAnatomicalInspection";
import { createHumanBodyArticularCandidateModel } from "../anatomy/articulation/createHumanBodyArticularCandidateModel";
import { parseHumanBodyBasisDocument } from "../document/parseHumanBodyBasisDocument";
import { exportHumanBody } from "../export/exportHumanBody";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";

import type { ConnectedBodyRequest } from "./ConnectedBodyRequest";
import type { ConnectedBodyResult } from "./ConnectedBodyResult";
import { packConnectedBodyModel } from "./packConnectedBodyModel";

/**
 * Consume complete numerical requests as visible target-sphere inspections.
 * The compiled inspector supplies the neutral reference, while the same
 * candidate-only source model feeds Float32 preview and explicit static export.
 * A failure never publishes a body generated from unvalidated context.
 *
 */
export function createConnectedBodyAnatomicalRuntime(
  basis: IAutoMovieHumanBodyBasis,
) {
  const inspect = createHumanBodyAnatomicalInspection(basis);
  return async (
    request: ConnectedBodyRequest,
  ): Promise<ConnectedBodyResult> => {
    if (
      request.operation === "construct" ||
      request.operation === "exportConstruction"
    )
      throw new Error(
        "Articular inspection does not construct a whole-person draft.",
      );
    const document = parseHumanBodyBasisDocument(
      request.document,
      basis.anatomicalAssembly,
    );
    if (request.operation === "armsDown")
      throw new Error(
        "Articular inspection does not resolve a body arms-down pose.",
      );
    const inspection = inspect(document);
    const model = createHumanBodyArticularCandidateModel({
      id: document.id,
      name: document.name,
      inspection,
    });
    if (request.operation === "export") {
      const { glb } = await exportHumanBody(model, inspection);
      return { operation: "export", glb };
    }
    return {
      operation: "preview",
      model: packConnectedBodyModel(model),
      crossings: null,
      anatomy: null,
      anatomicalRequest: inspection,
      extras: {},
    };
  };
}
