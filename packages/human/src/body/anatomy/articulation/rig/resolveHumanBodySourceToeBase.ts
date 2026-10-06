import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieHumanBodyBoneTransform } from "../../../structures/rig/IAutoMovieHumanBodyBoneTransform";
import type { IAutoMovieHumanBodySourceToeBase } from "./IAutoMovieHumanBodySourceToeBase";
import type { IAutoMovieHumanBodySourceRigInput } from "./IAutoMovieHumanBodySourceRigInput";
import { readHumanBodySourcePublicPose } from "./readHumanBodySourcePublicPose";

/** Evaluate the foot's sole aggregate MTP goal frame; no metatarsal or per-ray rotation is baked into it. */
export function resolveHumanBodySourceToeBase(base: IAutoMovieHumanBodySourceToeBase, parent: IAutoMovieHumanBodyBoneTransform, input: IAutoMovieHumanBodySourceRigInput, used: Set<string>): IAutoMovieHumanBodyBoneTransform {
  const carry = Quaternion.multiply(parent.posed.rotation,Quaternion.inverse(parent.rest.rotation));
  const local = readHumanBodySourcePublicPose(base.goal,input,used);
  return {
    rest: base.rest,
    posed: {
      position: Vector3.add(parent.posed.position,Quaternion.rotateVector(carry,Vector3.subtract(base.rest.position,parent.rest.position))),
      rotation: Quaternion.multiply(carry,Quaternion.multiply(base.rest.rotation,local)),
    },
  };
}
