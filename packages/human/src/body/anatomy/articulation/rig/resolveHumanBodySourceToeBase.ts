import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieQuaternion } from "@automovie/interface";

import type { IAutoMovieHumanBodyBoneTransform } from "../../../structures/rig/IAutoMovieHumanBodyBoneTransform";
import type { IAutoMovieHumanBodySourceRigInput } from "./IAutoMovieHumanBodySourceRigInput";
import type { IAutoMovieHumanBodySourceToeBase } from "./IAutoMovieHumanBodySourceToeBase";
import { readHumanBodySourcePublicPose } from "./readHumanBodySourcePublicPose";

/**
 * Evaluate the foot's sole aggregate MTP goal frame; no metatarsal or per-ray rotation is baked into it.
 *
 * The admitted source base and resolved foot parent use common body metres and registered rest orientations. The result retains the source rest frame and owns a fresh posed frame. The clinical reader records consumed goals in used; source registration and parent frames are unchanged.
 *
 * @evidence contracts/common.md#principled-implementation The foot's posed-times-inverse-rest carry transports the registered aggregate MTP frame, then existing clinical conversion supplies its sole common goal rotation.
 * @evidence contracts/common.md#clear-and-simple-design A named base resolver isolates common foot-goal evaluation from metatarsal carry and relative toe-ray motion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The result adds no metatarsal bone and bakes no individual ray motion into the aggregate frame.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes aggregate MTP ownership; expanded prose specifies rest/posed frames, source-admission assumptions and used-goal bookkeeping.
 * @evidence contracts/performance.md#efficient-algorithms Clinical row lookup costs O(P) for P public pose rows while frame carry and quaternion composition use constant-sized operations.
 * @evidence contracts/performance.md#reuse-equivalent-work The graph owner shares this completed base per foot within an evaluation; this helper retains no cross-call result because foot pose and goals may change.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Rest references remain source-owned and posed coordinates are fresh; the helper owns no toe-base map or long-lived conversion state.
 */
export function resolveHumanBodySourceToeBase(
  base: IAutoMovieHumanBodySourceToeBase,
  parent: IAutoMovieHumanBodyBoneTransform,
  input: IAutoMovieHumanBodySourceRigInput,
  used: Set<string>,
): IAutoMovieHumanBodyBoneTransform {
  const carry: IAutoMovieQuaternion = Quaternion.multiply(
    parent.posed.rotation,
    Quaternion.inverse(parent.rest.rotation),
  );
  const local: IAutoMovieQuaternion = readHumanBodySourcePublicPose(base.goal, input, used);
  return {
    rest: base.rest,
    posed: {
      position: Vector3.add(
        parent.posed.position,
        Quaternion.rotateVector(
          carry,
          Vector3.subtract(base.rest.position, parent.rest.position),
        ),
      ),
      rotation: Quaternion.multiply(
        carry,
        Quaternion.multiply(base.rest.rotation, local),
      ),
    },
  };
}
