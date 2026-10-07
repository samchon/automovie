import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanPersonHeadTransform } from "../structures/IAutoMovieHumanPersonHeadTransform";
import type { IAutoMovieHumanPersonHeadTransformProps } from "../structures/IAutoMovieHumanPersonHeadTransformProps";

/**
 * The rigid transform that carries a part built in the neutral head frame onto
 * the posed head bone of a shaped body.
 *
 * Every face part except the neck skin is built once in the neutral frame the
 * two bases share. That frame is centred on the eyes (the face basis rows are
 * the upstream state minus the eye centre's shift), so the shape carry is the
 * displacement of the same anchor, the body's eye centre, from
 * `anchor.neutral` to `anchor.shaped`. A pose
 * turns the bone to `posed`, so a point `p` of the face lands at
 * `R (p + (anchor.shaped - anchor.neutral)) + t`, with `R = posed.rotation *
 * rest.rotation⁻¹` and `t = posed.position - R rest.position`. This is what
 * skinning gives a vertex bound to one bone with weight one, which is the
 * property the bone's rigid parts (the skull, the jaw arch, the eyes, the hair
 * cards, the teeth) have by construction: they do not deform, they ride.
 *
 * The rotation is unpacked to a matrix once, so posing tens of thousands of
 * hair vertices is nine multiplications each. `point` moves a position and
 * `direction` rotates a normal, which a rigid motion leaves unit length.
 * `shift` is the translation of the rest frame alone, for callers that skin a
 * surface with several bones and need its rest positions first.
 *
 * @evidence contracts/common.md#principled-implementation `posed ∘ rest⁻¹` is the change of frame of a bone, and a vertex fixed to the bone follows that one rigid transform; the shift by the joint's displacement expresses the neutral-frame point in the shaped rest frame before the change of frame is applied.
 * @evidence contracts/common.md#clear-and-simple-design One rotation matrix and one translation, built once from the bone's two frames.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nothing is special-cased for a bone or a body; a non-unit rotation is normalized by the engine's quaternion product, and the matrix is read from the rotation itself.
 * @evidence contracts/common.md#meaningful-documentation The comment states the formula, which parts it serves and why it is exact for them.
 * @evidence contracts/modeling.md#spatial-conventions Metres in the shared Y-up, +Z-anterior frame; the conversion from the neutral frame to the shaped rest frame is the named `shift`, and the change of frame is the one explicit step.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function transforms points and defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function defines no input a caller shapes a human form with.
 */
export function createHumanPersonHeadTransform(
  props: IAutoMovieHumanPersonHeadTransformProps,
): IAutoMovieHumanPersonHeadTransform {
  const { anchor, rest, posed } = props;
  const rotation = Quaternion.multiply(
    posed.rotation,
    Quaternion.inverse(rest.rotation),
  );
  const offset = Vector3.subtract(
    posed.position,
    Quaternion.rotateVector(rotation, rest.position),
  );
  const shift = Vector3.subtract(anchor.shaped, anchor.neutral);
  const x = Quaternion.rotateVector(rotation, { x: 1, y: 0, z: 0 });
  const y = Quaternion.rotateVector(rotation, { x: 0, y: 1, z: 0 });
  const z = Quaternion.rotateVector(rotation, { x: 0, y: 0, z: 1 });
  const direction = (n: IAutoMovieVector3): IAutoMovieVector3 => ({
    x: x.x * n.x + y.x * n.y + z.x * n.z,
    y: x.y * n.x + y.y * n.y + z.y * n.z,
    z: x.z * n.x + y.z * n.y + z.z * n.z,
  });
  return {
    rotation,
    shift,
    direction,
    point: (p) => {
      const moved = direction({
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
