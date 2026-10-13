import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanBodyBoneTransform } from "../../../structures/rig/IAutoMovieHumanBodyBoneTransform";
import type { IAutoMovieHumanBodyBoneWorldRest } from "../../../structures/rig/IAutoMovieHumanBodyBoneWorldRest";
import type { IAutoMovieHumanBodySourceBoneNode } from "./IAutoMovieHumanBodySourceBoneNode";
import type { IAutoMovieHumanBodySourceRigInput } from "./IAutoMovieHumanBodySourceRigInput";
import { resolveHumanBodySourceAxes } from "./resolveHumanBodySourceAxes";

/**
 * Compose the same aggregate MTP motion after the actual metatarsal carry and before this ray's relative source axes.
 *
 * Requires an admitted proximal toe-ray joint and compatible parent, common base and foot rest/posed frames in common body metres. Other joint kinds throw. Supplied transforms stay unchanged; delegated source readers may add consumed goal addresses to used before a refusal.
 *
 * @evidence contracts/common.md#principled-implementation Foot carry is removed from the aggregate base rotation before common MTP motion carries the metatarsal, then the ray's registered relative axes apply in the shared graph.
 * @evidence contracts/common.md#clear-and-simple-design The proximal-ray resolver composes a temporary parent frame and delegates source-axis evaluation to the existing ordered-axis owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Subtracting foot carry prevents aggregate motion from being applied twice; no independently posed ray skeleton or extra anatomical carrier is introduced.
 * @evidence contracts/common.md#meaningful-documentation The description gives aggregate-before-relative composition; expanded prose identifies required toe-ray kind, frame premises and unchanged input transforms.
 * @evidence contracts/performance.md#efficient-algorithms Fixed-size common-turn arithmetic precedes the shared axes resolver; ray-axis count, goal rows and profile knots determine the delegated cost.
 * @evidence contracts/performance.md#reuse-equivalent-work The already evaluated aggregate base is supplied by the graph owner's per-foot cache, and this helper reuses the shared axes implementation for ray coordinates.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The temporary carried-parent frame is call-local and the returned world frame is fresh; supplied parent/base/foot frames are never mutated.
 */
export function resolveHumanBodySourceToeRay(
  node: IAutoMovieHumanBodySourceBoneNode,
  parent: IAutoMovieHumanBodyBoneTransform,
  base: IAutoMovieHumanBodyBoneTransform,
  foot: IAutoMovieHumanBodyBoneTransform,
  input: IAutoMovieHumanBodySourceRigInput,
  used: Set<string>,
): IAutoMovieHumanBodyBoneWorldRest {
  if (node.joint.kind !== "toe-ray")
    throw new Error(
      "A source proximal toe needs its registered toe-ray joint: " + node.id,
    );
  const footCarry: IAutoMovieQuaternion = Quaternion.multiply(
    foot.posed.rotation,
    Quaternion.inverse(foot.rest.rotation),
  );
  const carriedBaseRotation: IAutoMovieQuaternion = Quaternion.multiply(
    footCarry,
    base.rest.rotation,
  );
  const commonTurn: IAutoMovieQuaternion = Quaternion.multiply(
    base.posed.rotation,
    Quaternion.inverse(carriedBaseRotation),
  );
  const pivot: IAutoMovieVector3 = base.posed.position;
  const carrier: IAutoMovieHumanBodyBoneTransform = {
    rest: parent.rest,
    posed: {
      position: Vector3.add(
        pivot,
        Quaternion.rotateVector(
          commonTurn,
          Vector3.subtract(parent.posed.position, pivot),
        ),
      ),
      rotation: Quaternion.multiply(commonTurn, parent.posed.rotation),
    },
  };
  return resolveHumanBodySourceAxes(
    {
      ...node,
      joint: { kind: "axes", frame: node.joint.frame, axes: node.joint.axes },
    },
    carrier,
    input,
    used,
  );
}
