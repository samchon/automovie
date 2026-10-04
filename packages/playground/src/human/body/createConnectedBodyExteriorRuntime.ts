import { createHumanBodyExteriorTargetBuilder } from "@automovie/human/body/anatomy/surface/createHumanBodyExteriorTargetBuilder";
import type { IAutoMovieHumanBodyExteriorReference } from "@automovie/human/body/anatomy/surface/IAutoMovieHumanBodyExteriorReference";
import { parseHumanBodyAnatomicalDocument } from "@automovie/human/body/document/parseHumanBodyAnatomicalDocument";
import { exportHumanBody } from "@automovie/human/body/export/exportHumanBody";
import { humanBodyMeasurementRule } from "@automovie/human/body/measure/humanBodyMeasurementRule";
import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";

import { packConnectedBodyModel } from "./connectedBodyGeometry";
import type { ConnectedBodyRequest, ConnectedBodyResult } from "./connectedBodyProtocol";

/**
 * Wire the pinned source's instrument to the actual numerical exterior page.
 * The optional constructor binding lets other admitted sources supply their
 * own witnesses; it is never read from the numerical request. The normal worker
 * uses the existing source rule table, and no ordinal is copied into this adapter.
 * Preview and export evaluate the same physical candidate and original request.
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Connects one fictional absolute target to an admitted connected source surface with explicit unsupported context.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Carries physical candidate qualification beside unavailable clinical anatomy.
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-export Writes the actual exterior only on an explicit export request.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-export Reuses the existing static writer with source identity independent of articular qualification.
 */
export function createConnectedBodyExteriorRuntime(basis: IAutoMovieHumanBodyBasis, source?: IAutoMovieHumanBodyExteriorReference) {
  const reference: IAutoMovieHumanBodyExteriorReference = source ?? {
    basis: basis.id, evaluation: "source-rest", protocol: "bare-source-rest-nipple-level",
    channel: "measureBustCirc", measurement: humanBodyMeasurementRule("measureBustCirc")!,
    incidence: basis.surfaces.every((surface) => surface.sourcePartition === undefined) ? "native-indexed" : "source-partition",
  };
  const build = createHumanBodyExteriorTargetBuilder({ basis, reference });
  return async (request: ConnectedBodyRequest): Promise<ConnectedBodyResult> => {
    const document = parseHumanBodyAnatomicalDocument(request.document);
    if (request.operation === "armsDown")
      throw new Error("Source-conditioned exterior supports only its authored source-rest frame.");
    const built = build(document);
    if (request.operation === "export") {
      const { glb } = await exportHumanBody(built.model, undefined, { sourcePartIdentity: true });
      return { operation: "export", glb };
    }
    return {
      operation: "preview", model: packConnectedBodyModel(built.model),
      crossings: null, anatomy: null, exteriorCandidate: built.exterior, extras: {},
    };
  };
}
