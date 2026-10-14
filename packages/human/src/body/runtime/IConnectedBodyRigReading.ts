import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanBodyBuild } from "../structures/IAutoMovieHumanBodyBuild";
import type { IConnectedBodyAnatomicalBoneReading } from "./IConnectedBodyAnatomicalBoneReading";

/**
 * Existing placement readings from the construction whose model is displayed.
 * Positions are metres in the right-handed +Y-up, +Z-anterior, +X-left body
 * basis frame. Rest landmarks and skeleton precede pose and final ground
 * placement; posed bone frames and attachment sites retain that placement.
 * Frame origins are rig origins, not measured anatomical joint centres.
 * Build documents, skeleton, body placement arrays and frame values are borrowed read-only; anatomical map-entry arrays are new. Structured transport copying does not reconstruct or qualify the source rig.
 *
 * @evidence contracts/common.md#principled-implementation The record preserves existing rest and posed placement authority in one generation, retaining rig-frame origins separately from anatomical centre claims.
 * @evidence contracts/common.md#clear-and-simple-design Named optional source/person fields extend the same body reading without re-deriving positions in the transport schema.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rig placements and source graph entries remain observations, not inferred posed skin landmarks or clinical joint registration.
 * @evidence contracts/common.md#meaningful-documentation The prose and members give body-frame units, rest versus posed state, optional-source meanings and borrowed versus copied ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This placement-reading schema performs no matrix or map conversion.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Actual completed-build reuse and map packaging belong to readConnectedBodyRigReading.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type does not acquire a rig cache or mesh handle; caller and transport govern record lifetime.
 *
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
