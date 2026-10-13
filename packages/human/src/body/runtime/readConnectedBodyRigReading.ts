import type { AutoMovieHumanoidBone, IAutoMovieVector3 } from "@automovie/interface";

import type { AutoMovieHumanBodyBoneId } from "../anatomy/identity/AutoMovieHumanBodyBoneId";
import type { IAutoMovieHumanBodyBoneTransform } from "../structures/rig/IAutoMovieHumanBodyBoneTransform";
import type { IAutoMovieHumanBodyBuild } from "../structures/IAutoMovieHumanBodyBuild";

import type { IConnectedBodyRigReading } from "./IConnectedBodyRigReading";

/**
 * Expose one construction's returned placements for observation. Build records and frame values are borrowed and must be treated as read-only; keyed map arrays are newly allocated.
 * Map entries become keyed records without new frame calculations. Rest
 * landmarks remain distinct from posed frames and attachment sites. This
 * reading neither identifies posed skin landmarks nor judges source qualification.
 *
 * @evidence contracts/common.md#principled-implementation Existing placement maps become keyed arrays without recalculating frames; rest landmarks remain distinct from posed source sites.
 * @evidence contracts/common.md#clear-and-simple-design One adapter packages construction outputs for connected body and person observation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Returned rig origins remain source placements rather than inferred anatomical centres or posed skin landmarks.
 * @evidence contracts/common.md#meaningful-documentation The prose states borrowed build data, rest versus posed fields and the limits of source qualification.
 * @evidence contracts/performance.md#efficient-algorithms Conversion visits each anatomical bone, projection and attachment once; body document, skeleton and bone arrays are shared rather than rebuilt.
 * @evidence contracts/performance.md#reuse-equivalent-work The actual completed construction supplies every placement, avoiding a second shape or rig evaluation; the adapter retains no cross-call cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned reading borrows body records and frame values, while newly allocated keyed arrays live with its caller; no handles or asynchronous tasks are acquired.
 */
export function readConnectedBodyRigReading(
  body: IAutoMovieHumanBodyBuild,
  modelId: string = body.model.id,
  personBones?: IAutoMovieHumanBodyBuild["bones"],
): IConnectedBodyRigReading {
  const source: IAutoMovieHumanBodyBuild["anatomicalRig"] = body.anatomicalRig;
  return {
    modelId,
    bodyDocument: body.evaluatedDocument,
    bodySkeleton: body.skeleton,
    bodyBones: body.bones,
    bodyLandmarks: body.landmarks,
    personBones,
    ...(source === undefined ? {} : {
      anatomicalBones: Array.from(source.bones, ([bone, transform]: [AutoMovieHumanBodyBoneId, IAutoMovieHumanBodyBoneTransform]): NonNullable<IConnectedBodyRigReading["anatomicalBones"]>[number] => ({ bone, ...transform })),
      anatomicalProjections: Array.from(source.projections, ([bone, transform]: [AutoMovieHumanoidBone, IAutoMovieHumanBodyBoneTransform]): IAutoMovieHumanBodyBuild["bones"][number] => ({ bone, ...transform })),
      anatomicalSites: Array.from(source.sites, ([bone, sites]: [AutoMovieHumanBodyBoneId, ReadonlyMap<string, IAutoMovieVector3>]): [string, [string, IAutoMovieVector3][]] => [bone, Array.from(sites)]),
    }),
    groundPlaneHeightMetres: body.groundPlaneHeightMetres,
  };
}
