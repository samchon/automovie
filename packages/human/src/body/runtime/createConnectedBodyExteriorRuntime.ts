import type { IAutoMovieHumanBodyExteriorReference } from "../anatomy/surface/IAutoMovieHumanBodyExteriorReference";
import { createHumanBodyExteriorTargetBuilder } from "../anatomy/surface/createHumanBodyExteriorTargetBuilder";
import { parseHumanBodyBasisDocument } from "../document/parseHumanBodyBasisDocument";
import { exportHumanBody } from "../export/exportHumanBody";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";

import type { ConnectedBodyRequest } from "./ConnectedBodyRequest";
import type { ConnectedBodyResult } from "./ConnectedBodyResult";
import { packConnectedBodyModel } from "./packConnectedBodyModel";

/**
 * Wire the loaded source to the actual numerical exterior page. The optional
 * constructor registration lets another admitted source name its own topology
 * authority; it is never read from the numerical request. Instruments and
 * channels come from the package's target table, and no ordinal is copied into
 * this adapter.
 * Preview and export evaluate the same physical candidate and original request.
 */
export function createConnectedBodyExteriorRuntime(
  basis: IAutoMovieHumanBodyBasis,
  source?: IAutoMovieHumanBodyExteriorReference,
) {
  const reference: IAutoMovieHumanBodyExteriorReference = source ?? {
    basis: basis.id,
    evaluation: "source-rest",
    incidence: basis.surfaces.every(
      (surface) => surface.sourcePartition === undefined,
    )
      ? "native-indexed"
      : "source-partition",
  };
  const build = createHumanBodyExteriorTargetBuilder({ basis, reference });
  return async (
    request: ConnectedBodyRequest,
  ): Promise<ConnectedBodyResult> => {
    if (
      request.operation === "construct" ||
      request.operation === "exportConstruction"
    )
      throw new Error(
        "Exterior inspection does not construct a whole-person draft.",
      );
    const document = parseHumanBodyBasisDocument(
      request.document,
      basis.anatomicalAssembly,
    );
    if (request.operation === "armsDown")
      throw new Error(
        "Source-conditioned exterior supports only its authored source-rest frame.",
      );
    const built = build(document);
    if (request.operation === "export") {
      const { glb } = await exportHumanBody(built.model, undefined, {
        sourcePartIdentity: true,
      });
      return { operation: "export", glb };
    }
    return {
      operation: "preview",
      model: packConnectedBodyModel(built.model),
      crossings: null,
      anatomy: null,
      exteriorCandidate: built.exterior,
      extras: {},
    };
  };
}
