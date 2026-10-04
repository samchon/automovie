import type { IHumanSourceRigBoneEnd } from "./IHumanSourceRigBoneEnd.ts";

/**
 * One `rig.game_engine.json` bone as far as joint identity needs it.
 *
 * @author Samchon
 */
export interface IHumanSourceRigBone {
  parent: string;
  head: IHumanSourceRigBoneEnd;
  tail: IHumanSourceRigBoneEnd;
}
