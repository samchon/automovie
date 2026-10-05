import type { IHumanSourceRigBoneEnd } from "./IHumanSourceRigBoneEnd.ts";

/**
 * One MPFB rig JSON bone (`rig.game_engine.json`, `rig.default.json`) as
 * far as joint identity and the toe rays need it.
 *
 * @author Samchon
 */
export interface IHumanSourceRigBone {
  parent: string;
  head: IHumanSourceRigBoneEnd;
  tail: IHumanSourceRigBoneEnd;

  /** Bone roll about its head-to-tail axis, radians, when the rig records it. */
  roll?: number;
}
