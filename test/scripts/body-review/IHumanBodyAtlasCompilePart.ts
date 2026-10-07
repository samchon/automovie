import type { AutoMovieHumanBodyBoneId } from "@automovie/human/body/anatomy/identity/AutoMovieHumanBodyBoneId";
import type { AutoMovieHumanoidBone } from "@automovie/interface";

/** One source acquisition selected for offline reference registration. */
export interface IHumanBodyAtlasCompilePart {
  /** Closed runtime bone identity. */
  id: AutoMovieHumanBodyBoneId;

  /** Source OBJ file, relative to the compile plan. */
  file: string;

  /** Exact source identity expected in the acquired OBJ header. */
  identity: string;

  /** Source file ID expected in the header. */
  fileId: string;

  /** Humanoid reference carrier. */
  bone: AutoMovieHumanoidBone;

  /** Shared placement group preserves relative positions of adjacent bones. */
  group: string;

  /** The group's named anchor part, not an independently imaged joint centre. */
  anchorPart: AutoMovieHumanBodyBoneId;
}
