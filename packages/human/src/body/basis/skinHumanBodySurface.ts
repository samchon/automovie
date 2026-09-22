import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";

/**
 * Linear blend skinning of one shaped surface from rest to posed bone frames.
 *
 * For a vertex p with influences (bone_i, w_i), the posed position is
 * `sum(w_i * (posed_i.position + R_i (p - rest_i.position)))` with
 * `R_i = posed_i.rotation * rest_i.rotation^-1`. A vertex bound to one bone
 * with weight one therefore moves as a rigid body with that bone, which is
 * the arc the face's linear endpoints could not walk and the property the
 * rigid-segment check measures; a blended vertex takes the weighted mean of
 * its bones' rigid images, which is the volume loss at bent joints that pose
 * correctives exist to repair. Normals are not transported here: the builder
 * recomputes them on the posed surface so a seam between differently
 * weighted vertices cannot show a lighting discontinuity the geometry does
 * not have.
 *
 * Every bone the skin names must have a rest and a posed transform; the basis
 * admission guarantees the skin only names declared joints and the pose
 * resolver visits every declared joint, so a missing entry here is a
 * programming error rather than a data error, and it throws.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-joints Moves each vertex with its bones' rigid transforms so a half-open joint places skin on the arc, not the chord.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-joints Implements the weighted sum of `posed ∘ rest⁻¹` transforms the specification states, with unit-weight vertices exactly rigid.
 */
export function skinHumanBodySurface(
  positions: number[],
  skin: IAutoMovieHumanBodyBasis["surfaces"][number]["skin"],
  transforms: Map<
    AutoMovieHumanoidBone,
    {
      rest: { position: IAutoMovieVector3; rotation: IAutoMovieQuaternion };
      posed: { position: IAutoMovieVector3; rotation: IAutoMovieQuaternion };
    }
  >,
): number[] {
  const bones = skin.joints.map((bone) => {
    const transform = transforms.get(bone);
    if (transform === undefined)
      throw new Error("Body skin names a joint without transforms: " + bone);
    return {
      rotation: Quaternion.multiply(
        transform.posed.rotation,
        Quaternion.inverse(transform.rest.rotation),
      ),
      rest: transform.rest.position,
      posed: transform.posed.position,
    };
  });
  const output = new Array<number>(positions.length);
  for (let v = 0; v < positions.length / 3; v++) {
    const p = Vector3.create(
      positions[v * 3],
      positions[v * 3 + 1],
      positions[v * 3 + 2],
    );
    let x = 0,
      y = 0,
      z = 0;
    for (let k = 0; k < 4; k++) {
      const weight = skin.weights[v * 4 + k];
      if (weight === 0) continue;
      const bone = bones[skin.boneIndices[v * 4 + k]];
      const moved = Vector3.add(
        bone.posed,
        Quaternion.rotateVector(bone.rotation, Vector3.subtract(p, bone.rest)),
      );
      x += weight * moved.x;
      y += weight * moved.y;
      z += weight * moved.z;
    }
    output[v * 3] = x;
    output[v * 3 + 1] = y;
    output[v * 3 + 2] = z;
  }
  return output;
}
