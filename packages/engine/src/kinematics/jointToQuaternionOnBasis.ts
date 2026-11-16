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
 * @evidence contracts/development/implementation.md#principled-implementation An intrinsic Euler composition of three axis-angle quaternions in a declared order, a rotation for any orthonormal basis; the frame map is the exact affine inverse of `toClinicalAngle`. For an exact rig-declared outer identity and finite inner components, every Hamilton term after 1*b is a signed zero. Nonzero components therefore copy unchanged; zero components keep those original three products and addition/subtraction order, replacing only exact 1*b with b, including its zero sign. A fresh result preserves raw binary64 values; nonfinite inputs retain the full product.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Direct composition and its prepared companion read F/A/T and use the same two Hamilton products. The prepared path gives each axis its own scalar recent-factor slots, so every candidate avoids a general keyed composition-state dispatch; jointToQuaternion still delegates after admitting the basis.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A `null` angle is the documented rest rotation, and a non-finite angle throws instead of becoming zero.
 * @evidence contracts/development/implementation.md#efficient-algorithms Direct composition keeps three axis-angle factors and two products in constant time. Prepared candidates share their documented pure factors and fixed inner products. For an exact marked outer identity with a finite component sum, each nonzero result component omits four products/three additions and each zero component keeps three zero products/three additions. Guards and a fresh four-field result remain; nonidentity/nonfinite products keep the original formula. No basis validation is added and runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller admits the basis once. The direct entry recomputes every factor; prepare lets one query reuse its initial and two recent Object.is-equal rig-angle factors per axis and an unchanged inner pair's exact Hamilton product. Pinning the first actual reading lets a box query reuse its reference factors after the corner traversal, without retaining any completed joint answer. prepareQueries also shares fixed axis scalars and, when declared by its rig, at most two fixed-angle factors per axis and four fixed inner products. Actual angle/frame checks precede every lookup; only exact resolved-number matches borrow a declared factor, and only two actual private declared operands share an operation inner product. Each query owns its dynamic factor/inner slots. Initialization follows the original angle read, sine-division/component-product grouping is unchanged, raw components never mutate and the outer product is fresh.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; the caller owns the returned quaternion.
 */
export function jointToQuaternionOnBasis(
  joint: Pick<IAutoMovieJointPose, AutoMovieClinicalAxis>,
  basis: IAutoMovieJointAxes,
  frame?: IAutoMovieRestFrame,
): IAutoMovieQuaternion {
  const qFlexion: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    basis.flexion,
    readAngle(joint, "flexion", frame?.flexion),
  );
  const qAbduction: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    basis.abduction,
    readAngle(joint, "abduction", frame?.abduction),
  );
  const qTwist: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    basis.twist,
    readAngle(joint, "twist", frame?.twist),
  );
  return basis.twistPlacement === "distal"
    ? Quaternion.multiply(qAbduction, Quaternion.multiply(qFlexion, qTwist))
    : Quaternion.multiply(qTwist, Quaternion.multiply(qAbduction, qFlexion));
}

/**
 * Query-owned dynamic factors and declared rig constants on unchanged axes/frame.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines unchanged basis/frame/declared-angle lifetime, lazy F/A/T validation, resolved-number keys, query-owned recent factors/inner product and bounded rig scalar/fixed-factor preparation, with fresh output.
 * @evidence contracts/development/design.md#principled-representation An axis-angle factor depends only on its fixed admitted axis and exact resolved rig angle. A rig-declared constant has that same value independently of every target; Object.is equality permits sharing its pure factor. Identical private operands also give the same inner Hamilton product under the original grouping; two operation-declared factors therefore define target-independent fixed inner algebra.
 * @evidence contracts/development/design.md#minimal-and-owned-surface prepare serves one query's scores or lower-joint trials. prepareQueries returns independent composers and optionally borrows at most two declared rig angles per axis, as the actual box projector supplies. No quaternion injection, factor/inner getter, target-result control or global cache is exposed.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every joint still runs F/A/T finite/frame admission before factor lookup. Only Object.is-equal resolved finite angles borrow a declared constant; null, signed-zero, alias or clamp discrepancies follow the ordinary query path. Each query owns three readers with at most nine scalar-keyed initial/recent readings and one dynamic inner product, whose prior operands may survive partial admission. Initial slots contain only one pure axis factor each, never a joint, target or completed articulation. Metadata never mutates raw quaternions, and outer output is fresh. Operation state retains at most three lazy axis scalar readers, six declared-angle factors, their at most six weak exact-identity markers and four fixed-factor inner products. Identity markers register only factors this owner actually produced after admission; finite inner components copy only when nonzero, while zero components retain the original signed-zero terms/order. No external descriptor, tolerance or target fact establishes the shortcut. No changing target/reference/candidate or dynamic inner product crosses queries. The caller keeps axes/frame/declarations unchanged and releases the factory and all query composers with their operation.
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
   * Hamilton grouping, sharing the first and two most recent exact-angle
   * factors per axis and one inner product when both private factors match.
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
   * Two actual private declared factors may also share their inner product,
   * at most four combinations. Other factors and dynamic inner slots remain
   * fresh per query. Keep basis, frame and declarations unchanged; release the
   * factory and its composers with the operation. No complete target rotation
   * survives a query.
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

/** Fixed rig arithmetic only; no changing target, factor row or dynamic inner. */
interface IOperationState {
  /** Three lazy original direction/length readers, populated after successful use. */
  axisReaders: IAxisAngleReaders;

  /** Borrowed immutable rig coordinates, at most two for each axis. */
  fixedAngles?: jointToQuaternionOnBasis.IFixedAngles;

  /** Raw factors made by this owner only at an actual matching angle read. */
  fixedFactors?: Partial<Record<AutoMovieClinicalAxis, IFixedReadings>>;

  /** At most four raw products of two private operation-declared factors. */
  fixedInnerProducts?: IAutoMovieQuaternion[];

  /** Exact identities among at most six actual private rig-declared factors. */
  identityFactors?: WeakSet<IAutoMovieQuaternion>;
}

/** Fresh query state, optionally borrowing operation-owned rig arithmetic. */
function preparedComposition(
  basis: IAutoMovieJointAxes,
  frame?: IAutoMovieRestFrame,
  operation?: IOperationState,
): ReturnType<typeof jointToQuaternionOnBasis.prepare> {
  const flexion: IPreparedFactor = prepareFactor("flexion", operation);
  const abduction: IPreparedFactor = prepareFactor("abduction", operation);
  const twist: IPreparedFactor = prepareFactor("twist", operation);
  let innerLeft: IAutoMovieQuaternion | undefined;
  let innerRight: IAutoMovieQuaternion | undefined;
  let inner: IAutoMovieQuaternion | undefined;
  return (
    joint: Pick<IAutoMovieJointPose, AutoMovieClinicalAxis>,
  ): IAutoMovieQuaternion => {
    const qFlexion: IAutoMovieQuaternion = flexion(
      basis.flexion,
      readAngle(joint, "flexion", frame?.flexion),
    );
    const qAbduction: IAutoMovieQuaternion = abduction(
      basis.abduction,
      readAngle(joint, "abduction", frame?.abduction),
    );
    const qTwist: IAutoMovieQuaternion = twist(
      basis.twist,
      readAngle(joint, "twist", frame?.twist),
    );
    const distal: boolean = basis.twistPlacement === "distal";
    const left: IAutoMovieQuaternion = distal ? qFlexion : qAbduction;
    const right: IAutoMovieQuaternion = distal ? qTwist : qFlexion;
    if (innerLeft !== left || innerRight !== right) {
      inner = operation?.fixedAngles === undefined
        ? Quaternion.multiply(left, right)
        : fixedInnerProduct(operation, distal, left, right);
      innerLeft = left;
      innerRight = right;
    }
    const outer: IAutoMovieQuaternion = distal ? qAbduction : qTwist;
    const product: IAutoMovieQuaternion = inner!;

    // Identity's signed-zero terms leave nonzero finite components unchanged.
    // Zero components retain those exact terms/order to keep their zero sign.
    if (operation?.identityFactors?.has(outer) === true &&
      Number.isFinite(product.x + product.y + product.z + product.w))
      return {
        x: product.x !== 0 ? product.x
          : product.x + outer.x * product.w + outer.y * product.z - outer.z * product.y,
        y: product.y !== 0 ? product.y
          : product.y - outer.x * product.z + outer.y * product.w + outer.z * product.x,
        z: product.z !== 0 ? product.z
          : product.z + outer.x * product.y - outer.y * product.x + outer.z * product.w,
        w: product.w !== 0 ? product.w
          : product.w - outer.x * product.x - outer.y * product.y - outer.z * product.z,
      };
    return Quaternion.multiply(outer, product);
  };
}

/** Share the original product only when both actual factors are rig constants. */
function fixedInnerProduct(
  operation: IOperationState,
  distal: boolean,
  left: IAutoMovieQuaternion,
  right: IAutoMovieQuaternion,
): IAutoMovieQuaternion {
  const leftFactors: IFixedReadings | undefined =
    operation.fixedFactors?.[distal ? "flexion" : "abduction"];
  const rightFactors: IFixedReadings | undefined =
    operation.fixedFactors?.[distal ? "twist" : "flexion"];
  const leftIndex: number = leftFactors === undefined ? -1
    : left === leftFactors[0] ? 0 : left === leftFactors[1] ? 1 : -1;
  const rightIndex: number = rightFactors === undefined ? -1
    : right === rightFactors[0] ? 0 : right === rightFactors[1] ? 1 : -1;
  if (leftIndex < 0 || rightIndex < 0) return Quaternion.multiply(left, right);
  const index: number = leftIndex * 2 + rightIndex;
  const known: IAutoMovieQuaternion | undefined = operation.fixedInnerProducts?.[index];
  if (known !== undefined) return known;
  const quaternion: IAutoMovieQuaternion = Quaternion.multiply(left, right);
  operation.fixedInnerProducts ??= [];
  operation.fixedInnerProducts[index] = quaternion;
  return quaternion;
}

/** One query-local factor reader; caller completes original angle admission. */
type IPreparedFactor = (
  axis: IAutoMovieVector3,
  angle: number,
) => IAutoMovieQuaternion;

/** Scalar recent-factor slots eliminate keyed metadata reads per candidate. */
function prepareFactor(
  key: AutoMovieClinicalAxis,
  operation: IOperationState | undefined,
): IPreparedFactor {
  let currentAngle: number | undefined;
  let current: IAutoMovieQuaternion | undefined;
  let initialAngle: number | undefined;
  let initial: IAutoMovieQuaternion | undefined;
  let previousAngle: number | undefined;
  let previous: IAutoMovieQuaternion | undefined;
  let reader: ReturnType<typeof Quaternion.prepareAxisAngle> | undefined;
  return (axis: IAutoMovieVector3, angle: number): IAutoMovieQuaternion => {
    if (current !== undefined && Object.is(currentAngle, angle)) return current;
    const reused: IAutoMovieQuaternion | undefined =
      previous !== undefined && Object.is(previousAngle, angle) ? previous
        : initial !== undefined && Object.is(initialAngle, angle) ? initial : undefined;
    if (reused !== undefined) {
      const quaternion: IAutoMovieQuaternion = reused;
      previousAngle = currentAngle;
      previous = current;
      currentAngle = angle;
      current = quaternion;
      return quaternion;
    }
    const axisAngle: ReturnType<typeof Quaternion.prepareAxisAngle> =
      reader ?? operation?.axisReaders[key] ?? Quaternion.prepareAxisAngle(axis);
    const quaternion: IAutoMovieQuaternion = operation?.fixedAngles === undefined
      ? axisAngle(angle) : fixedFactor(operation, key, angle, axisAngle);
    if (operation !== undefined && operation.axisReaders[key] === undefined)
      operation.axisReaders[key] = axisAngle;
    reader = axisAngle;
    if (initial === undefined) {
      initialAngle = angle;
      initial = quaternion;
    }
    previousAngle = currentAngle;
    previous = current;
    currentAngle = angle;
    current = quaternion;
    return quaternion;
  };
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
  if (quaternion.x === 0 && quaternion.y === 0 && quaternion.z === 0 && quaternion.w === 1) {
    operation.identityFactors ??= new WeakSet<IAutoMovieQuaternion>();
    operation.identityFactors.add(quaternion);
  }
  operation.fixedFactors ??= {};
  const readings: IFixedReadings = operation.fixedFactors[key] ??= [];
  readings[index] = quaternion;
  return quaternion;
}
