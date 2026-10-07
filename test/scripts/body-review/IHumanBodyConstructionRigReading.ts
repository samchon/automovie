import type { IAutoMovieSkeleton, IAutoMovieVector3 } from "@automovie/interface";
import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyBuildBone } from "@automovie/human/body/structures/rig/IAutoMovieHumanBodyBuildBone";
import type { IHumanBodyAnatomicalBoneReading } from "./IHumanBodyAnatomicalBoneReading";

/**
 * Returned rig state accompanying one complete construction archive.
 * Positions are body-frame metres and rotations are the owner's unit
 * quaternions. Optional source fields remain absent when the build has no
 * anatomical graph; missing state is never inferred from static vertices.
 * These observations leave construction admission and layer readings separate.
 *
 * @evidence contracts/common.md#principled-implementation Names the actual generation, source digest and evaluated document beside returned frames.
 * @evidence contracts/common.md#clear-and-simple-design Named arrays retain the different source, skin and person frame owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Optional state stays optional and no missing transform is reconstructed.
 * @evidence contracts/common.md#meaningful-documentation States units, absent-source meaning and the admission boundary.
 * @evidence contracts/modeling.md#spatial-conventions Preserves the returned right-handed +Y-up, +Z-anterior, +X-left body-basis placements.
 * @author Samchon
 */
export interface IHumanBodyConstructionRigReading {
  /** Model archive whose construction supplied these values. */
  modelId: string;

  /** Actual paired source generation used by the construction owner. */
  generation: string;

  /** Original registered assembly bytes consumed by this construction. */
  sourceAssemblySha256: string;

  /** Actual evaluated body document, including its basis, shape and pose. */
  bodyDocument: IAutoMovieHumanBodyBasisDocument;

  /** Returned shaped rest skeleton; static model geometry has already been posed. */
  bodySkeleton: IAutoMovieSkeleton;

  /** Returned humanoid rest/posed world placements used by the body. */
  bodyBones: IAutoMovieHumanBodyBuildBone[];

  /** Actual shaped landmarks; no neutral anchor is estimated from them. */
  bodyLandmarks: Record<string, IAutoMovieVector3>;

  /** Person owner's returned body, jaw and eye placements, absent for body-only construction. */
  personBones?: IAutoMovieHumanBodyBuildBone[];

  /** Actual anatomical graph entries, absent when that graph was not returned. */
  anatomicalBones?: IHumanBodyAnatomicalBoneReading[];

  /** Existing source-to-humanoid projection pairs from the same anatomical result. */
  anatomicalProjections?: IAutoMovieHumanBodyBuildBone[];

  /** Existing source-ground reading, preserved only when the build supplies it. */
  groundPlaneHeightMetres?: number;
}
