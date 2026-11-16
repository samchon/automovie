import {
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { IAutoMovieAxisFrame } from "../rom/IAutoMovieAxisFrame";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { toRigAngle } from "../rom/toRigAngle";

/** The three clinical coordinates, read in their existing admission order. */
type AutoMovieClinicalAxis = "flexion" | "abduction" | "twist";

/** Preserve null rest, angle admission and the caller's clinical frame map. */
const readAngle: (
  joint: Pick<IAutoMovieJointPose, AutoMovieClinicalAxis>,
  axis: AutoMovieClinicalAxis,
  frame: IAutoMovieAxisFrame | undefined,
) => number = (
  joint: Pick<IAutoMovieJointPose, AutoMovieClinicalAxis>,
  axis: AutoMovieClinicalAxis,
  frame: IAutoMovieRestFrame[AutoMovieClinicalAxis] | undefined,
): number => {
  const value: number | null = joint[axis];
  if (value !== null && !Number.isFinite(value))
    throw new Error(
      `jointToQuaternion ${axis} must be finite or null, but was ${value}`,
    );
  return toRigAngle(value, frame) ?? 0;
};

/**
 * {@link jointToQuaternion} on a basis its caller already admitted and
 * normalized through {@link normalizeJointAxes}: the composition itself, with
 * no validation of the basis.
 *
 * A solver that composes hundreds of candidate joints through one basis
 * normalizes it once and calls this for each, as
 * `decomposeJointRotationOnBasis` serves the inverse. The axes, the two
 * composition orders, the `null` rest and the frame map are
 * `jointToQuaternion`'s, which documents them and is this function behind
 * one normalization.
 *
 * Throws on a non-finite angle or an invalid frame sign or neutral. A basis
 * that is not orthonormal composes a quaternion that is not the joint's
 * rotation; nothing here detects it.
 *
 * @param joint Clinical angles in degrees; `null` axes are at rest.
 * @param basis Orthonormal clinical axis basis, as `normalizeJointAxes` returns it.
 * @param frame Rest frame mapping clinical angles to rest-relative ones;
 *   omitted, the angles are already rest-relative.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the caller must have done to the basis, why the entry exists, that the conventions are `jointToQuaternion`'s, what is thrown and what an unnormalized basis silently gives.
 * @evidence contracts/development/implementation.md#principled-implementation An intrinsic Euler composition of three axis-angle quaternions in a declared order, a rotation for any orthonormal basis; the frame map is the exact affine inverse of `toClinicalAngle`.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One private composition owns factor lookup, F/A/T reads and the original Hamilton grouping for both the direct function and its prepared companion; jointToQuaternion still delegates after admitting the basis.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A `null` angle is the documented rest rotation, and a non-finite angle throws instead of becoming zero.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three axis-angle quaternions and two products in constant time, with no validation of the basis.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller admits the basis once. The direct entry recomputes every factor; prepare additionally lets one query reuse an Object.is-equal resolved rig angle's pure axis factor and the unchanged inner pair's exact Hamilton product. Its private three-axis/one-inner metadata rows are updated in place; raw factor identities and quaternion components are never overwritten. Every clinical-angle/frame check still runs, the outer product is always fresh, and both entries use the same composition owner.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; the caller owns the returned quaternion.
 */
export function jointToQuaternionOnBasis(
  joint: Pick<IAutoMovieJointPose, AutoMovieClinicalAxis>,
  basis: IAutoMovieJointAxes,
  frame?: IAutoMovieRestFrame,
): IAutoMovieQuaternion {
  return compose(joint, basis, frame);
}

/**
 * Query-owned factors and one inner product on an unchanged admitted basis/frame.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines lazy per-joint F/A/T validation, resolved-rig-angle keys, fixed basis/frame scope, three axis slots plus one exact inner-pair slot and fresh outer-product output.
 * @evidence contracts/development/design.md#principled-representation An axis-angle factor depends only on its fixed admitted axis and exact resolved rig angle. Object.is equality permits sharing that pure factor; identical private operand records also give the same inner Hamilton product under the original grouping.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One prepared composer serves actual analytic/general projection scores and lower-joint trials. No factor or inner-product getter, target result, snapshot key or global cache is exposed.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every joint still runs readAngle in F/A/T order, including finite/frame admission and null/signed-zero semantics. Only private matching factor identities can share an inner product; the outer product is always fresh. At most three axis metadata rows and one inner row are allocated and reused privately, without changing raw quaternion objects. The caller keeps basis/frame unchanged and releases all slots with this query; no full rotation answer is reused across targets.
 */
export namespace jointToQuaternionOnBasis {
  /**
   * Prepare a composer for one query's changing clinical coordinates on the
   * same admitted basis/frame. Construction admits no joint or unused frame.
   * Each call preserves the direct entry's axis lookup, angle checks and
   * Hamilton grouping, sharing at most one exact-angle factor per axis and
   * one inner product when both private factor records are identical.
   * Results are fresh outer products and expose no private factor or inner.
   * Drop the closure when the query ends; no target history is retained.
   */
  export function prepare(
    basis: IAutoMovieJointAxes,
    frame?: IAutoMovieRestFrame,
  ): (
    joint: Pick<IAutoMovieJointPose, AutoMovieClinicalAxis>,
  ) => IAutoMovieQuaternion {
    const cache: ICompositionState = { factors: {} };
    return (
      joint: Pick<IAutoMovieJointPose, AutoMovieClinicalAxis>,
    ): IAutoMovieQuaternion => compose(joint, basis, frame, cache);
  }
}

/** Query-owned pure intermediates, never a complete joint rotation. */
interface ICompositionState {
  /** Last exact rig-angle factor for each of the three admitted axes. */
  factors: Partial<Record<AutoMovieClinicalAxis, IFactor>>;

  /** At most one completed inner pair in the existing Euler grouping. */
  inner?: IInnerProduct;
}

/** Exact private operands and their raw Hamilton product. */
interface IInnerProduct {
  /** Outer operand of the existing inner pair. */
  left: IAutoMovieQuaternion;

  /** Inner operand, kept in the original order. */
  right: IAutoMovieQuaternion;

  /** Pure intermediate, never returned as the whole joint rotation. */
  quaternion: IAutoMovieQuaternion;
}

/** One private pure factor for the last exact rig angle of an axis. */
interface IFactor {
  /** Resolved rig degrees; Object.is distinguishes positive and negative zero. */
  angle: number;

  /** Unnormalized axis-angle output, never returned to a caller directly. */
  quaternion: IAutoMovieQuaternion;
}

/** One composition rule, preserving basis lookup and F/A/T admission order. */
function compose(
  joint: Pick<IAutoMovieJointPose, AutoMovieClinicalAxis>,
  basis: IAutoMovieJointAxes,
  frame?: IAutoMovieRestFrame,
  cache?: ICompositionState,
): IAutoMovieQuaternion {
  const qFlexion: IAutoMovieQuaternion = factor(
    basis.flexion,
    readAngle(joint, "flexion", frame?.flexion),
    "flexion",
    cache?.factors,
  );
  const qAbduction: IAutoMovieQuaternion = factor(
    basis.abduction,
    readAngle(joint, "abduction", frame?.abduction),
    "abduction",
    cache?.factors,
  );
  const qTwist: IAutoMovieQuaternion = factor(
    basis.twist,
    readAngle(joint, "twist", frame?.twist),
    "twist",
    cache?.factors,
  );
  const distal: boolean = basis.twistPlacement === "distal";
  const left: IAutoMovieQuaternion = distal ? qFlexion : qAbduction;
  const right: IAutoMovieQuaternion = distal ? qTwist : qFlexion;
  const known: IInnerProduct | undefined = cache?.inner;
  let inner: IAutoMovieQuaternion;
  if (known !== undefined && known.left === left && known.right === right)
    inner = known.quaternion;
  else {
    inner = Quaternion.multiply(left, right);
    if (cache !== undefined) {
      if (known === undefined) cache.inner = { left, right, quaternion: inner };
      else {
        known.left = left;
        known.right = right;
        known.quaternion = inner;
      }
    }
  }
  return Quaternion.multiply(distal ? qAbduction : qTwist, inner);
}

/** Share only the pure factor after the original readAngle has completed. */
function factor(
  axis: IAutoMovieVector3,
  angle: number,
  key: AutoMovieClinicalAxis,
  cache: Partial<Record<AutoMovieClinicalAxis, IFactor>> | undefined,
): IAutoMovieQuaternion {
  const known: IFactor | undefined = cache?.[key];
  if (known !== undefined && Object.is(known.angle, angle))
    return known.quaternion;
  const quaternion: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    axis,
    angle,
  );
  if (cache !== undefined) {
    if (known === undefined) cache[key] = { angle, quaternion };
    else {
      known.angle = angle;
      known.quaternion = quaternion;
    }
  }
  return quaternion;
}
