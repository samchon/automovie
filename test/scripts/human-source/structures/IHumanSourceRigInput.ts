import type { IHumanSourceBodyInput } from "./IHumanSourceBodyInput.ts";
import type { IHumanSourceRigBone } from "./IHumanSourceRigBone.ts";

/**
 * Body rig reproduction inputs: the body inputs plus the pinned MPFB
 * `rig.game_engine.json` document, whose joint-cube names define each bone.
 *
 * @author Samchon
 */
export interface IHumanSourceRigInput extends IHumanSourceBodyInput {
  gameEngineRig: Record<string, IHumanSourceRigBone>;
}
