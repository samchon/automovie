import {
  type IAutoMovieRestFrame,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";

/**
 * Project the basis joints onto a rest skeleton from the shaped landmarks.
 *
 * Each bone's world frame follows the rule the basis was extracted under: Y
 * from head to tail, X equal to `Y x F` where F is the flexion reference with
 * its component along Y removed, Z equal to `X x Y`. That frame is the
 * engine's default clinical basis, so `resolvePose` needs no per-bone axis
 * table for non-humeral joints; what it needs is the per-side sign of
 * abduction and twist and the clinical angle each axis rests at, which the
 * basis hands over as `IAutoMovieRestFrame`s. The upper-arm Euler axes are
 * held and its bone frame serves as the skin's rest orientation; the separate
 * TT shoulder resolver computes its clinical goal after the girdle moves.
 *
 * The rest transform of a bone is its world frame expressed in its parent's:
 * the root keeps its world frame and head as translation. Because the
 * landmarks are read after the shape, the joint centres follow the body they
 * sit in, which is what the source's joint cubes were for.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-joints Recomputes every joint centre from shaped landmarks so the pivots follow the body's form, and expresses each joint in the standard humanoid skeleton.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-joints Builds the `Y x F` frame, the parent-relative rest transform and the sign rest frames the specification defines.
 */
export function resolveHumanBodySkeleton(
  basis: IAutoMovieHumanBodyBasis,
  landmarks: Record<string, IAutoMovieVector3>,
): {
  skeleton: IAutoMovieSkeleton;
  rest: Map<
    AutoMovieHumanoidBone,
    { position: IAutoMovieVector3; rotation: IAutoMovieQuaternion }
  >;
  frames: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;
} {
  const rest = new Map<
    AutoMovieHumanoidBone,
    { position: IAutoMovieVector3; rotation: IAutoMovieQuaternion }
  >();
  const frames: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>> =
    {};
  const bones = basis.joints.map((joint) => {
    const head = landmarks[joint.head];
    const tail = landmarks[joint.tail];
    const y = Vector3.normalize(Vector3.subtract(tail, head));
    const reference = Vector3.create(...joint.reference);
    const f = Vector3.normalize(
      Vector3.subtract(reference, Vector3.scale(y, Vector3.dot(reference, y))),
    );
    const x = Vector3.cross(y, f);
    const z = Vector3.cross(x, y);
    const rotation = quaternionFromBasis(x, y, z);
    rest.set(joint.bone, { position: head, rotation });
    // The engine reads a document's clinical angle and turns the rig by
    // `(clinical - neutral) / sign`, so the measured rest angle travels here
    // and the empty pose is exactly the rest.
    const frame: IAutoMovieRestFrame = {
      flexion: { sign: joint.signs.flexion, neutral: joint.neutral.flexion },
    };
    if (joint.signs.abduction !== null)
      frame.abduction = {
        sign: joint.signs.abduction,
        neutral: joint.neutral.abduction,
      };
    if (joint.signs.twist !== null)
      frame.twist = { sign: joint.signs.twist, neutral: joint.neutral.twist };
    frames[joint.bone] = frame;
    const parent = joint.parent === null ? null : rest.get(joint.parent)!;
    const inverse =
      parent === null
        ? Quaternion.identity()
        : Quaternion.inverse(parent.rotation);
    return {
      bone: joint.bone,
      parent: joint.parent,
      rest: {
        translation:
          parent === null
            ? head
            : Quaternion.rotateVector(
                inverse,
                Vector3.subtract(head, parent.position),
              ),
        rotation: Quaternion.multiply(inverse, rotation),
        scale: Vector3.create(1, 1, 1),
      },
      constraint: joint.constraint,
    };
  });
  return { skeleton: { id: basis.id + "/skeleton", bones }, rest, frames };
}

/**
 * Unit quaternion of the rotation whose columns are the orthonormal vectors
 * `x`, `y`, `z` (local axes expressed in world). Shepperd's method: pick the
 * largest diagonal term so the square root never divides by a small number.
 */
function quaternionFromBasis(
  x: IAutoMovieVector3,
  y: IAutoMovieVector3,
  z: IAutoMovieVector3,
): IAutoMovieQuaternion {
  const m00 = x.x,
    m01 = y.x,
    m02 = z.x;
  const m10 = x.y,
    m11 = y.y,
    m12 = z.y;
  const m20 = x.z,
    m21 = y.z,
    m22 = z.z;
  const trace = m00 + m11 + m22;
  let q: IAutoMovieQuaternion;
  if (trace > 0) {
    const s = Math.sqrt(trace + 1) * 2;
    q = {
      w: s / 4,
      x: (m21 - m12) / s,
      y: (m02 - m20) / s,
      z: (m10 - m01) / s,
    };
  } else if (m00 > m11 && m00 > m22) {
    const s = Math.sqrt(1 + m00 - m11 - m22) * 2;
    q = {
      w: (m21 - m12) / s,
      x: s / 4,
      y: (m01 + m10) / s,
      z: (m02 + m20) / s,
    };
  } else if (m11 > m22) {
    const s = Math.sqrt(1 + m11 - m00 - m22) * 2;
    q = {
      w: (m02 - m20) / s,
      x: (m01 + m10) / s,
      y: s / 4,
      z: (m12 + m21) / s,
    };
  } else {
    const s = Math.sqrt(1 + m22 - m00 - m11) * 2;
    q = {
      w: (m10 - m01) / s,
      x: (m02 + m20) / s,
      y: (m12 + m21) / s,
      z: s / 4,
    };
  }
  return Quaternion.normalize(q);
}
