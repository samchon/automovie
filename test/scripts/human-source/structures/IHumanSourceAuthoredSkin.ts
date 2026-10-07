import type { IHumanSourceAuthoredCut } from "./IHumanSourceAuthoredCut.ts";

/** Neutral geometry views of the same canonical root and rig support.
 * Anatomical registrations and endpoint replay remain separate derivatives.
 * @author Samchon
 */
export interface IHumanSourceAuthoredSkin {
  partition: IHumanSourceAuthoredCut;
  positions: Float64Array;
  bones: [string, number][][];
  attachments: [string, number][][];
  headPositions: Float64Array;
  bodyPositions: Float64Array;
  headBones: [string, number][][];
  bodyBones: [string, number][][];
  headAttachments: [string, number][][];
  bodyAttachments: [string, number][][];
}
