import type { IAutoMovieHumanBodyBuild } from "@automovie/human/body/structures/IAutoMovieHumanBodyBuild";
import type { IAutoMovieVector3 } from "@automovie/interface";
import type { IConnectedBodyAnatomicalBoneReading } from "./IConnectedBodyAnatomicalBoneReading";

/**
 * Existing placement readings from the construction whose model is displayed.
 * Positions are metres in the right-handed +Y-up, +Z-anterior, +X-left body
 * basis frame. Rest landmarks and skeleton precede pose and final ground
 * placement; posed bone frames and attachment sites retain that placement.
 * Frame origins are rig origins, not measured anatomical joint centres.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Carries the evaluated body document and its returned placements with the model the editor inspects.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Preserves one worker evaluation's shaped rest skeleton, posed frames and actual model identity as separate readings.
 * @author Samchon
 */
export interface IConnectedBodyRigReading {
  /** Actual static model supplied by the construction owner. */
  modelId: string;

  /** Evaluated body document, including its actual basis and resolved channels. */
  bodyDocument: IAutoMovieHumanBodyBuild["evaluatedDocument"];

  /** Shaped rest skeleton before pose and final ground placement. */
  bodySkeleton: IAutoMovieHumanBodyBuild["skeleton"];

  /** Existing named rest/posed world placement pairs. */
  bodyBones: IAutoMovieHumanBodyBuild["bones"];

  /** Shaped rest landmarks; these are not posed skin vertices. */
  bodyLandmarks: IAutoMovieHumanBodyBuild["landmarks"];

  /** Existing whole-person placement pairs, absent for body-only construction. */
  personBones?: IAutoMovieHumanBodyBuild["bones"];

  /** Actual graph entries, absent when no anatomical rig was returned. */
  anatomicalBones?: IConnectedBodyAnatomicalBoneReading[];

  /** Existing source-to-humanoid placement pairs from this evaluation. */
  anatomicalProjections?: IAutoMovieHumanBodyBuild["bones"];

  /** Original posed attachment maps serialized as keyed pairs, not re-derived points. */
  anatomicalSites?: Array<[string, Array<[string, IAutoMovieVector3]>]>;

  /** Owner's fixed source-neutral ground plane, absent when not returned. */
  groundPlaneHeightMetres?: number;
}
