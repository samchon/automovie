import {
  type IAutoMovieJointAxes,
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
 * A joint that declares `flexionAxis` flexes about that landmark line read
 * in its rest frame instead of the frame's X, with the abduction axis the
 * frame's Z made perpendicular to it and the twist axis completing the
 * right-handed basis, and those joints' axes are returned for `resolvePose`.
 *
 * The rest transform of a bone is its world frame expressed in its parent's:
 * the root keeps its world frame and head as translation. Because the
 * landmarks are read after the shape, the joint centres follow the body they
 * sit in, which is what the source's joint cubes were for.
 * A shaped zero/nonfinite bone direction or unavailable projected flexion
 * reference refuses here, before a quaternion is constructed. Normalizing an
 * arbitrary quaternion from a missing axis would not define the promised
 * frame. Every nonzero finite projected reference retains the existing rule;
 * no replacement direction or angular tolerance is introduced.
 * The same precondition applies to the computed transverse basis and declared
 * flexion/abduction/twist axes. A rounded nonzero projection parallel to Y
 * still supplies no transverse frame, even if quaternion normalization could
 * manufacture a unit rotation from those degenerate columns.
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
  axes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;
} {
  const rest = new Map<
    AutoMovieHumanoidBone,
    { position: IAutoMovieVector3; rotation: IAutoMovieQuaternion }
  >();
  const frames: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>> =
    {};
  const axes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>> = {};
  const bones = basis.joints.map((joint) => {
    const head = landmarks[joint.head];
    const tail = landmarks[joint.tail];
    const direction = Vector3.subtract(tail, head);
    assertFrameDirection(direction, "bone direction", joint.bone);
    const y = Vector3.normalize(direction);
    const reference = Vector3.create(...joint.reference);
    const projected = Vector3.subtract(reference, Vector3.scale(y, Vector3.dot(reference, y)));
    assertFrameDirection(projected, "projected flexion reference", joint.bone);
    const f = Vector3.normalize(projected);
    const x = Vector3.cross(y, f);
    assertFrameDirection(x, "X frame direction", joint.bone);
    const z = Vector3.cross(x, y);
    assertFrameDirection(z, "Z frame direction", joint.bone);
    const rotation = quaternionFromBasis(x, y, z);
    rest.set(joint.bone, { position: head, rotation });
    if (joint.flexionAxis !== undefined) {
      // the declared line in the bone's rest frame, turned to flex the same
      // way as the frame's X; abduction keeps as close to Z as it can
      const declaredLine = Vector3.subtract(landmarks[joint.flexionAxis[1]], landmarks[joint.flexionAxis[0]]);
      assertFrameDirection(declaredLine, "declared flexion line", joint.bone);
      const line = Quaternion.rotateVector(
        Quaternion.inverse(rotation),
        Vector3.normalize(declaredLine),
      );
      const flexion = line.x < 0 ? Vector3.scale(line, -1) : line;
      const transverse = Vector3.subtract(
          Vector3.create(0, 0, 1),
          Vector3.scale(flexion, flexion.z),
      );
      assertFrameDirection(transverse, "abduction projection", joint.bone);
      const abduction = Vector3.normalize(transverse);
      const twist = Vector3.cross(abduction, flexion);
      assertFrameDirection(twist, "twist direction", joint.bone);
      axes[joint.bone] = {
        flexion,
        abduction,
        twist,
      };
    }
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
  return {
    skeleton: { id: basis.id + "/skeleton", bones },
    rest,
    frames,
    axes,
  };
}

/** A computed frame direction must exist before normalization or quaternion construction. */
function assertFrameDirection(vector: IAutoMovieVector3, role: string, bone: AutoMovieHumanoidBone): void {
  if (![vector.x, vector.y, vector.z].every(Number.isFinite) || (vector.x === 0 && vector.y === 0 && vector.z === 0))
    throw new Error(`Body shaped joint needs a finite nonzero ${role}: ${bone}`);
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
