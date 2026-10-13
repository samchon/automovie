import type { IAutoMovieHumanBodyBuild } from "../structures/IAutoMovieHumanBodyBuild";

import type { IConnectedBodyRigReading } from "./IConnectedBodyRigReading";

/**
 * Preserve one construction's returned placements for read-only observation.
 * Map entries become keyed records without new frame calculations. Rest
 * landmarks remain distinct from posed frames and attachment sites. This
 * reading neither identifies posed skin landmarks nor judges source qualification.
 *
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
