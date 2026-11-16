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
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller admits the basis once. The direct entry recomputes every factor; prepare lets one query reuse two recent Object.is-equal rig-angle factors per axis and an unchanged inner pair's exact Hamilton product. prepareQueries also shares fixed axis scalars and, when declared by its rig, at most two fixed-angle factors per axis. Actual angle/frame checks precede every lookup; only exact resolved-number matches borrow a declared factor. Each query owns its dynamic factor/inner slots. Initialization follows the original angle read, sine-division/component-product grouping is unchanged, raw components never mutate and the outer product is fresh.
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
 * Query-owned dynamic factors and declared rig constants on unchanged axes/frame.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines unchanged basis/frame/declared-angle lifetime, lazy F/A/T validation, resolved-number keys, query-owned recent factors/inner product and bounded rig scalar/fixed-factor preparation, with fresh output.
 * @evidence contracts/development/design.md#principled-representation An axis-angle factor depends only on its fixed admitted axis and exact resolved rig angle. A rig-declared constant has that same value independently of every target; Object.is equality permits sharing its pure factor. Identical private operands also give the same inner Hamilton product under the original grouping.
 * @evidence contracts/development/design.md#minimal-and-owned-surface prepare serves one query's scores or lower-joint trials. prepareQueries returns independent composers and optionally borrows at most two declared rig angles per axis, as the actual box projector supplies. No quaternion injection, factor/inner getter, target-result control or global cache is exposed.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every joint still runs F/A/T finite/frame admission before factor lookup. Only Object.is-equal resolved finite angles borrow a declared constant; null, signed-zero, alias or clamp discrepancies follow the ordinary query path. Each query owns three rows with at most six indexed readings and one inner row, whose prior operands may survive partial admission. Metadata never mutates raw quaternions, and outer output is fresh. Operation state retains at most three lazy axis scalar readers and six declared-angle factors, never target/reference/candidate history or a cross-query inner product. The caller keeps axes/frame/declarations unchanged and releases the factory and all query composers with their operation.
 */
export namespace jointToQuaternionOnBasis {
  /** At most two unchanged, predeclared rig angles per axis; never target readings. */
  export type IFixedAngles = Partial<Record<
    AutoMovieClinicalAxis, readonly [number] | readonly [number, number]
  >>;

  /**
   * Prepare a composer for one query's changing clinical coordinates on the
   * same admitted basis/frame. Construction admits no joint or unused frame.
   * Each call preserves the direct entry's axis lookup, angle checks and
   * Hamilton grouping, sharing the two most recent exact-angle factors per
   * axis and one inner product when both private factor records are identical.
   * Results are fresh outer products and expose no private factor or inner.
   * Drop the closure when the query ends; no target history is retained.
   */
  export function prepare(
    basis: IAutoMovieJointAxes,
    frame?: IAutoMovieRestFrame,
  ): (
    joint: Pick<IAutoMovieJointPose, AutoMovieClinicalAxis>,
  ) => IAutoMovieQuaternion {
    return preparedComposition(basis, frame);
  }

  /**
   * Prepare independent query composers on one unchanged admitted basis/frame.
   * Construction reads no axis or joint. The first successful factor on each
   * axis prepares its original rescaled direction/length. Optional fixedAngles
   * are the rig's unchanged resolved numbers, not clinical coordinates or query
   * answers: only an exact finite match lazily shares that private pure factor.
   * Other readings and every inner slot remain fresh per query. Keep basis,
   * frame and declarations unchanged; release the factory and its composers
   * with the operation. No complete target rotation survives a query.
   */
  export function prepareQueries(
    basis: IAutoMovieJointAxes,
    frame?: IAutoMovieRestFrame,
    fixedAngles?: IFixedAngles,
  ): () => ReturnType<typeof prepare> {
    const operation: IOperationState = { axisReaders: {} };
    if (fixedAngles !== undefined) operation.fixedAngles = fixedAngles;
    return (): ReturnType<typeof prepare> =>
      preparedComposition(basis, frame, operation);
  }
}

/** Lazy fixed-axis scalar readers; they retain no angle or quaternion output. */
type IAxisAngleReaders = Partial<Record<
  AutoMovieClinicalAxis, ReturnType<typeof Quaternion.prepareAxisAngle>
>>;

/** At most two lazy private factors for one axis's declared rig coordinates. */
type IFixedReadings = [IAutoMovieQuaternion?, IAutoMovieQuaternion?];

/** Fixed rig arithmetic only; no changing target, factor row or inner product. */
interface IOperationState {
  /** Three lazy original direction/length readers, populated after successful use. */
  axisReaders: IAxisAngleReaders;

  /** Borrowed immutable rig coordinates, at most two for each axis. */
  fixedAngles?: jointToQuaternionOnBasis.IFixedAngles;

  /** Raw factors made by this owner only at an actual matching angle read. */
  fixedFactors?: Partial<Record<AutoMovieClinicalAxis, IFixedReadings>>;
}

/** Fresh query state, optionally borrowing operation-owned rig arithmetic. */
function preparedComposition(
  basis: IAutoMovieJointAxes,
  frame?: IAutoMovieRestFrame,
  operation?: IOperationState,
): ReturnType<typeof jointToQuaternionOnBasis.prepare> {
  const cache: ICompositionState = { factors: {} };
  if (operation !== undefined) cache.operation = operation;
  return (
    joint: Pick<IAutoMovieJointPose, AutoMovieClinicalAxis>,
  ): IAutoMovieQuaternion => compose(joint, basis, frame, cache);
}

/** Query-owned pure intermediates, never a complete joint rotation. */
interface ICompositionState {
  /** Two recent exact rig-angle factors for each of the three admitted axes. */
  factors: Partial<Record<AutoMovieClinicalAxis, IFactor>>;

  /** Optional fixed rig arithmetic; dynamic factor/inner slots stay in this row. */
  operation?: IOperationState;

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

/** One axis's two private exact-angle readings and fixed scalar preparation. */
interface IFactor {
  /** Resolved rig degrees; Object.is distinguishes positive and negative zero. */
  angle: number;

  /** Unnormalized axis-angle output, never returned to a caller directly. */
  quaternion: IAutoMovieQuaternion;

  /** Lazy original raw-axis/length preparation, query-owned or borrowed. */
  axisAngle: ReturnType<typeof Quaternion.prepareAxisAngle>;

  /** The second most recent exact angle and raw factor, distinct from current. */
  previous?: { angle: number; quaternion: IAutoMovieQuaternion };
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
    cache,
  );
  const qAbduction: IAutoMovieQuaternion = factor(
    basis.abduction,
    readAngle(joint, "abduction", frame?.abduction),
    "abduction",
    cache,
  );
  const qTwist: IAutoMovieQuaternion = factor(
    basis.twist,
    readAngle(joint, "twist", frame?.twist),
    "twist",
    cache,
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
  cache: ICompositionState | undefined,
): IAutoMovieQuaternion {
  const known: IFactor | undefined = cache?.factors[key];
  if (known !== undefined && Object.is(known.angle, angle))
    return known.quaternion;
  if (cache === undefined) return Quaternion.fromAxisAngle(axis, angle);
  const previous: IFactor["previous"] = known?.previous;
  if (known !== undefined && previous !== undefined && Object.is(previous.angle, angle)) {
    const quaternion: IAutoMovieQuaternion = previous.quaternion;
    previous.angle = known.angle;
    previous.quaternion = known.quaternion;
    known.angle = angle;
    known.quaternion = quaternion;
    return quaternion;
  }
  const operation: IOperationState | undefined = cache.operation;
  const axisAngle: ReturnType<typeof Quaternion.prepareAxisAngle> =
    known?.axisAngle ?? operation?.axisReaders[key] ?? Quaternion.prepareAxisAngle(axis);
  const quaternion: IAutoMovieQuaternion = operation?.fixedAngles === undefined
    ? axisAngle(angle) : fixedFactor(operation, key, angle, axisAngle);
  if (operation !== undefined && operation.axisReaders[key] === undefined)
    operation.axisReaders[key] = axisAngle;
  if (known === undefined) cache.factors[key] = { angle, quaternion, axisAngle };
  else {
    if (previous === undefined)
      known.previous = { angle: known.angle, quaternion: known.quaternion };
    else {
      previous.angle = known.angle;
      previous.quaternion = known.quaternion;
    }
    known.angle = angle;
    known.quaternion = quaternion;
  }
  return quaternion;
}

/** Share only an exact actual match to a finite rig-declared constant. */
function fixedFactor(
  operation: IOperationState,
  key: AutoMovieClinicalAxis,
  angle: number,
  read: ReturnType<typeof Quaternion.prepareAxisAngle>,
): IAutoMovieQuaternion {
  const declared: jointToQuaternionOnBasis.IFixedAngles[AutoMovieClinicalAxis] =
    operation.fixedAngles?.[key];
  if (declared === undefined || !Number.isFinite(angle)) return read(angle);
  const index: 0 | 1 | null = Object.is(angle, declared[0]) ? 0
    : declared.length === 2 && Object.is(angle, declared[1]) ? 1 : null;
  if (index === null) return read(angle);
  const known: IAutoMovieQuaternion | undefined = operation.fixedFactors?.[key]?.[index];
  if (known !== undefined) return known;
  const quaternion: IAutoMovieQuaternion = read(angle);
  operation.fixedFactors ??= {};
  const readings: IFixedReadings = operation.fixedFactors[key] ??= [];
  readings[index] = quaternion;
  return quaternion;
}
