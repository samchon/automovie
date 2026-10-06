import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieHumanBodyBoneTransform } from "../../../structures/rig/IAutoMovieHumanBodyBoneTransform";
import type { IAutoMovieHumanBodyBoneWorldRest } from "../../../structures/rig/IAutoMovieHumanBodyBoneWorldRest";
import type { IAutoMovieHumanBodySourceBoneNode } from "./IAutoMovieHumanBodySourceBoneNode";
import type { IAutoMovieHumanBodySourceRigInput } from "./IAutoMovieHumanBodySourceRigInput";
import { resolveHumanBodySourceAxes } from "./resolveHumanBodySourceAxes";

/** Compose the same aggregate MTP motion after the actual metatarsal carry and before this ray's relative source axes. */
export function resolveHumanBodySourceToeRay(node: IAutoMovieHumanBodySourceBoneNode, parent: IAutoMovieHumanBodyBoneTransform, base: IAutoMovieHumanBodyBoneTransform, foot: IAutoMovieHumanBodyBoneTransform, input: IAutoMovieHumanBodySourceRigInput, used: Set<string>): IAutoMovieHumanBodyBoneWorldRest {
  if (node.joint.kind !== "toe-ray") throw new Error("A source proximal toe needs its registered toe-ray joint: "+node.id);
  const footCarry = Quaternion.multiply(foot.posed.rotation,Quaternion.inverse(foot.rest.rotation));
  const carriedBaseRotation = Quaternion.multiply(footCarry,base.rest.rotation);
  const commonTurn = Quaternion.multiply(base.posed.rotation,Quaternion.inverse(carriedBaseRotation));
  const pivot = base.posed.position;
  const carrier: IAutoMovieHumanBodyBoneTransform = {
    rest: parent.rest,
    posed: {
      position: Vector3.add(pivot,Quaternion.rotateVector(commonTurn,Vector3.subtract(parent.posed.position,pivot))),
      rotation: Quaternion.multiply(commonTurn,parent.posed.rotation),
    },
  };
  return resolveHumanBodySourceAxes({...node,joint:{kind:"axes",frame:node.joint.frame,axes:node.joint.axes}},carrier,input,used);
}
