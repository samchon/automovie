import { createHumanBodyAnatomicalInspection } from "@automovie/human/body/anatomy/articulation/createHumanBodyAnatomicalInspection";
import { createHumanBodyArticularCandidateModel } from "@automovie/human/body/anatomy/articulation/createHumanBodyArticularCandidateModel";
import { parseHumanBodyBasisDocument } from "@automovie/human/body/document/parseHumanBodyBasisDocument";
import { exportHumanBody } from "@automovie/human/body/export/exportHumanBody";
import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";

import type { ConnectedBodyRequest } from "./ConnectedBodyRequest";
import type { ConnectedBodyResult } from "./ConnectedBodyResult";
import { packConnectedBodyModel } from "./connectedBodyGeometry";

/**
 * Consume complete numerical requests as visible target-sphere inspections.
 * The compiled inspector supplies the neutral reference, while the same
 * candidate-only source model feeds Float32 preview and explicit static export.
 * A failure never publishes a body generated from unvalidated context.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Connects admitted numerical requests to the existing worker and candidate inspection viewport without presenting unavailable whole anatomy as resolved.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Preserves the numerical request and concrete inspection report in a correlated preview transaction.
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-export Encodes explicitly requested candidate-only static geometry through the existing exporter.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-export Keeps numerical document replay distinct from the exported static candidate artifact.
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
