import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3, IAutoMovieQuaternion } from "@automovie/interface";

import type { IAutoMovieHumanPersonHeadTransform } from "../structures/IAutoMovieHumanPersonHeadTransform";
import type { IAutoMovieHumanPersonHeadTransformProps } from "../structures/IAutoMovieHumanPersonHeadTransformProps";

/**
 * The rigid transform that carries a part built in the neutral head frame onto the posed head bone of a shaped body.
 *
 * Rigid face points begin in the neutral frame the two bases share. That frame is centred on the eyes (the face basis rows are the upstream state minus the eye centre's shift), so the shape carry is the displacement of the same anchor, the body's eye centre, from `anchor.neutral` to `anchor.shaped`. A pose turns the bone to `posed`, so a point `p` of the face lands at `R (p + (anchor.shaped - anchor.neutral)) + t`, with `R = posed.rotation * rest.rotation⁻¹` and `t = posed.position - R rest.position`. This is what skinning gives a vertex bound to one bone with weight one, which is the property of a rigid point after its own face performance. Mixed generated parts can subsequently replace registered skin/material seats through the actual weighted skin owner, rather than remaining wholly rigid.
 *
 * The rotation is unpacked to a matrix once, so posing tens of thousands of hair vertices is nine multiplications each. `point` moves a position and `direction` rotates a normal, which a rigid motion leaves unit length. `shift` is the translation of the rest frame alone, for callers that skin a surface with several bones and need its rest positions first.
 *
 * Positions and translations use common source metres. Finite admitted bone frames with unit rotations are caller premises; this helper adds no frame admission, re-normalization or clinical head/body alignment.
 *
 * @evidence contracts/common.md#principled-implementation Posed rotation times inverse rest rotation and their translated bone origins give the rigid carry; neutral-to-shaped eye-anchor shift enters before rotation, matching one-bone unit-weight skinning.
 * @evidence contracts/common.md#clear-and-simple-design One compiled rotation basis serves point and direction operations, while exposed shift serves the separate weighted-skin path; mixed material seats retain their downstream owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No ad hoc collar or stature correction is introduced; admitted finite unit bone frames remain premises and rigid transport supplies no clinical alignment proof.
 * @evidence contracts/common.md#meaningful-documentation Prose gives metre frames, exact carry formula, direction versus position, rest shift and the mixed-seat/unit-quaternion premises.
 * @evidence contracts/performance.md#efficient-algorithms Fixed quaternion/vector preparation unpacks three rotated axes once; each subsequent point or direction uses constant matrix arithmetic independent of total part population.
 * @evidence contracts/performance.md#reuse-equivalent-work All vertices for one actual anchor/rest/posed triple share the derived rotation basis and offset; changed shape or pose requires a new transform.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned callbacks retain only derived axes, shift and offset until dropped; input bones and source meshes are not kept, and each evaluation returns a new vector.
 */
export function createHumanPersonHeadTransform(
  props: IAutoMovieHumanPersonHeadTransformProps,
): IAutoMovieHumanPersonHeadTransform {
  const { anchor, rest, posed }: IAutoMovieHumanPersonHeadTransformProps = props;
  const rotation: IAutoMovieQuaternion = Quaternion.multiply(
    posed.rotation,
    Quaternion.inverse(rest.rotation),
  );
  const offset: IAutoMovieVector3 = Vector3.subtract(
    posed.position,
    Quaternion.rotateVector(rotation, rest.position),
  );
  const shift: IAutoMovieVector3 = Vector3.subtract(anchor.shaped, anchor.neutral);
  const x: IAutoMovieVector3 = Quaternion.rotateVector(rotation, { x: 1, y: 0, z: 0 });
  const y: IAutoMovieVector3 = Quaternion.rotateVector(rotation, { x: 0, y: 1, z: 0 });
  const z: IAutoMovieVector3 = Quaternion.rotateVector(rotation, { x: 0, y: 0, z: 1 });
  const direction: (n: IAutoMovieVector3) => IAutoMovieVector3 = (n: IAutoMovieVector3): IAutoMovieVector3 => ({
    x: x.x * n.x + y.x * n.y + z.x * n.z,
    y: x.y * n.x + y.y * n.y + z.y * n.z,
    z: x.z * n.x + y.z * n.y + z.z * n.z,
  });
  return {
    rotation,
    shift,
    direction,
    point: (p: IAutoMovieVector3): IAutoMovieVector3 => {
      const moved: IAutoMovieVector3 = direction({
        x: p.x + shift.x,
        y: p.y + shift.y,
        z: p.z + shift.z,
      });
      return {
        x: moved.x + offset.x,
        y: moved.y + offset.y,
        z: moved.z + offset.z,
      };
    },
  };
}
