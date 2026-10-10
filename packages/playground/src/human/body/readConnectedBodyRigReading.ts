import type { IAutoMovieHumanBodyBuild } from "@automovie/human/body/structures/IAutoMovieHumanBodyBuild";

import type { IConnectedBodyRigReading } from "./IConnectedBodyRigReading";

/**
 * Preserve one construction's returned placements for read-only observation.
 * Map entries become keyed records without new frame calculations. Rest
 * landmarks remain distinct from posed frames and attachment sites. This
 * reading neither identifies posed skin landmarks nor judges source qualification.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Supplies the resident editor with its own body construction's placements without re-evaluating that document.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Serializes returned graph maps alongside the same worker result's model identity and evaluated document.
 */
export function readConnectedBodyRigReading(
  body: IAutoMovieHumanBodyBuild,
  modelId: string = body.model.id,
  personBones?: IAutoMovieHumanBodyBuild["bones"],
): IConnectedBodyRigReading {
  const source = body.anatomicalRig;
  return {
    modelId,
    bodyDocument: body.evaluatedDocument,
    bodySkeleton: body.skeleton,
    bodyBones: body.bones,
    bodyLandmarks: body.landmarks,
    personBones,
    ...(source === undefined ? {} : {
      anatomicalBones: Array.from(source.bones, ([bone, transform]) => ({ bone, ...transform })),
      anatomicalProjections: Array.from(source.projections, ([bone, transform]) => ({ bone, ...transform })),
      anatomicalSites: Array.from(source.sites, ([bone, sites]) => [bone, Array.from(sites)]),
    }),
    groundPlaneHeightMetres: body.groundPlaneHeightMetres,
  };
}
