import type { IAutoMovieHumanBodySourceBoneNode } from "./IAutoMovieHumanBodySourceBoneNode";
import type { IAutoMovieHumanBodySourcePelvicRhythm } from "./IAutoMovieHumanBodySourcePelvicRhythm";
import type { IAutoMovieHumanBodySourceToeBase } from "./IAutoMovieHumanBodySourceToeBase";

/** One shared source generation's complete parent-before-child anatomical graph. */
export interface IAutoMovieHumanBodySourceRig {
  /** Optional source registration for the existing final hips-only rhythm transition. */
  pelvicRhythm?: IAutoMovieHumanBodySourcePelvicRhythm;
  /** One aggregate MTP goal frame per foot, shared by its proximal phalanges and public toes projection. */
  toeBases?: readonly IAutoMovieHumanBodySourceToeBase[];
  /** Independent source graph revision, carried with registered meshes and every derivative. */
  generation: string;

  /** Every bone is named once; parents and thorax references precede their consumers. */
  nodes: readonly IAutoMovieHumanBodySourceBoneNode[];
}
