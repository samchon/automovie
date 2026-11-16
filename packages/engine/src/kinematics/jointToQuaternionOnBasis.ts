import {
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { multiplyQuaternionInto } from "../math/multiplyQuaternionInto";
import { IAutoMovieAxisFrame } from "../rom/IAutoMovieAxisFrame";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { toRigAngle } from "../rom/toRigAngle";

/** The three clinical coordinates, read in their existing admission order. */
type AutoMovieClinicalAxis = "flexion" | "abduction" | "twist";

/** Lazy affine readers for at most three unchanged clinical axis frames. */
type IRigAngleReaders = Partial<Record<
  AutoMovieClinicalAxis, ReturnType<typeof toRigAngle.prepare>
>>;

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
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Direct composition and its prepared companion read F/A/T and use the same two Hamilton products. Each prepared axis factor also owns clinical finite admission and its lazy affine reader, eliminating a second generic angle-reader call/keyed joint lookup. Its arguments evaluate axis, frame and direct named clinical value in the original order. One nonescaping query scratch receives dynamic inner products through multiply's same scalar owner; rig-only inner products remain private immutable records, and jointToQuaternion still delegates after admitting the basis.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A `null` angle is the documented rest rotation, and a non-finite angle throws instead of becoming zero.
 * @evidence contracts/development/implementation.md#efficient-algorithms Direct composition keeps three axis-angle factors and two products in constant time. Prepared candidates fold three former generic readAngle calls into their required factor readers, use direct named joint properties, borrow a successful affine reader locally and omit each query's affine lookup record. Null/absent frames use exact direct results without a conversion call; finite admission remains on every value. Changed dynamic inner pairs reuse one query scratch instead of one quaternion allocation per pair; shared constant pairs retain their original product record. Pure factor/fixed inner sharing remains. For an exact marked outer identity with a finite component sum, each nonzero result component omits four products/three additions and each zero component keeps three zero products/three additions. Guards and a fresh four-field result remain; nonidentity/nonfinite products keep the original formula. No basis validation is added and runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller admits the basis once. Direct composition recomputes every factor/frame admission; prepared composition keeps original F/A/T axis then frame then clinical-value reads and finite checks inside its three factor readers, then lazily admits each actual nonnull fixed frame once through toRigAngle.prepare. A factor borrows its successful converter locally, with the operation map used only at first actual framed conversion; unchanged frame identities share only neutral/sign, replacement admits anew and null/absent frames allocate no converter. One query reuses its initial and two recent Object.is-equal rig-angle factors per axis and an unchanged inner pair's exact Hamilton product. Pinning the first reading lets a box query reuse reference factors after corner traversal without retaining a completed joint answer. prepareQueries shares three fixed-axis scalar and at most three affine readers plus, when declared by its rig, two fixed-angle factors per axis and four fixed inner products. Exact resolved-number matches alone borrow factors, and two actual private declared operands alone share an operation inner product. Dynamic factors/inner slots remain query-owned. Changed dynamic pairs write only a private scratch after the preceding outer output copied its scalar components; shared factors, rig-only products and returned raw quaternions never mutate. Initialization and sine-division/component-product grouping remain unchanged.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Direct calls retain nothing and return a fresh quaternion. A prepared query owns three factor closures with at most nine initial/recent scalar-keyed factors, one dynamic inner product and up to three locally borrowed affine readers, with no joint/target/output history. Without an operation those readers release with the query. prepareQueries owns at most three axis and three affine readers, six declared factors/their weak identity markers and four fixed inner products until rig-operation release; query state releases independently and every outer output stays fresh.
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
 * @evidence contracts/development/common.md#meaningful-documentation Defines unchanged basis/frame/declared-angle lifetime, lazy first nonnull frame admission after each actual F/A/T finite check, null bypass, resolved-number keys, query-owned initial/recent factors/inner product and bounded rig scalar/affine/fixed-factor preparation, with fresh output.
 * @evidence contracts/development/design.md#principled-representation An axis-angle factor depends only on its fixed admitted axis and exact resolved rig angle. A rig-declared constant has that same value independently of every target; Object.is equality permits sharing its pure factor. Identical private operands also give the same inner Hamilton product under the original grouping; two operation-declared factors therefore define target-independent fixed inner algebra.
 * @evidence contracts/development/design.md#minimal-and-owned-surface prepare serves one query's scores or lower-joint trials. prepareQueries returns independent composers and optionally borrows at most two declared rig angles per axis, as the actual box projector supplies. No quaternion injection, factor/inner getter, target-result control or global cache is exposed.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every joint still runs original F/A/T axis/frame lookups and clinical finite checks before factor lookup. Actual used nonnull frames receive original first-use sign/neutral admission; same-identity reuse requires unchanged frame values and replacement admits anew. Null/absent frames create no converter and no invalid frame is admitted during construction. Only Object.is-equal resolved finite angles borrow a declared constant; null, signed-zero, alias or clamp discrepancies follow the ordinary query path. Each query owns three readers with at most nine scalar-keyed initial/recent factors and one dynamic inner scratch, whose prior operands may survive partial admission. Initial slots retain one pure axis factor each, never a joint, target or completed articulation. Only the nonescaping inner scratch is overwritten; shared factors/products and fresh outer outputs never mutate. Operation state retains at most three axis-scalar and three affine readers, six declared factors, their at most six weak exact-identity markers and four fixed inner products. Markers register only actual private factors after admission; finite nonzero components copy while zero components retain signed-zero terms/order. No descriptor, tolerance or target fact establishes a shortcut. No changing target/candidate or dynamic inner crosses queries; the caller releases preparation with its unchanged rig.
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
   * Used nonnull fixed frames receive original admission on first actual use;
   * later same-object reads share their exact affine scalars. Null rest still
   * bypasses an unused frame, and every clinical angle is checked each call.
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
   * Up to three actual-used nonnull affine frame readers also share this rig's
   * original first-use admission/scalars; every query keeps angle checks and
   * frame lookup order, with replacement frames admitted normally.
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

  /** At most three actual-used nonnull frame converters, owned by this rig. */
  rigAngles?: IRigAngleReaders;

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
  let dynamicInner: IAutoMovieQuaternion | undefined;
  return (
    joint: Pick<IAutoMovieJointPose, AutoMovieClinicalAxis>,
  ): IAutoMovieQuaternion => {
    const qFlexion: IAutoMovieQuaternion = flexion(
      basis.flexion,
      frame?.flexion,
      joint.flexion,
    );
    const qAbduction: IAutoMovieQuaternion = abduction(
      basis.abduction,
      frame?.abduction,
      joint.abduction,
    );
    const qTwist: IAutoMovieQuaternion = twist(
      basis.twist,
      frame?.twist,
      joint.twist,
    );
    const distal: boolean = basis.twistPlacement === "distal";
    const left: IAutoMovieQuaternion = distal ? qFlexion : qAbduction;
    const right: IAutoMovieQuaternion = distal ? qTwist : qFlexion;
    if (innerLeft !== left || innerRight !== right) {
      const shared: IAutoMovieQuaternion | undefined = operation?.fixedAngles === undefined
        ? undefined
        : fixedInnerProduct(operation, distal, left, right);
      if (shared !== undefined) inner = shared;
      else {
        dynamicInner ??= { x: 0, y: 0, z: 0, w: 0 };
        multiplyQuaternionInto(dynamicInner, left, right);
        inner = dynamicInner;
      }
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
): IAutoMovieQuaternion | undefined {
  const leftFactors: IFixedReadings | undefined =
    operation.fixedFactors?.[distal ? "flexion" : "abduction"];
  const rightFactors: IFixedReadings | undefined =
    operation.fixedFactors?.[distal ? "twist" : "flexion"];
  const leftIndex: number = leftFactors === undefined ? -1
    : left === leftFactors[0] ? 0 : left === leftFactors[1] ? 1 : -1;
  const rightIndex: number = rightFactors === undefined ? -1
    : right === rightFactors[0] ? 0 : right === rightFactors[1] ? 1 : -1;
  if (leftIndex < 0 || rightIndex < 0) return undefined;
  const index: number = leftIndex * 2 + rightIndex;
  const known: IAutoMovieQuaternion | undefined = operation.fixedInnerProducts?.[index];
  if (known !== undefined) return known;
  const quaternion: IAutoMovieQuaternion = Quaternion.multiply(left, right);
  operation.fixedInnerProducts ??= [];
  operation.fixedInnerProducts[index] = quaternion;
  return quaternion;
}

/** One query-local scalar factor reader including original clinical admission. */
type IPreparedFactor = (
  axis: IAutoMovieVector3,
  frame: IAutoMovieAxisFrame | undefined,
  clinical: number | null,
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
  let rigAngle: ReturnType<typeof toRigAngle.prepare> | undefined;
  return (
    axis: IAutoMovieVector3,
    frame: IAutoMovieAxisFrame | undefined,
    clinical: number | null,
  ): IAutoMovieQuaternion => {
    if (clinical !== null && !Number.isFinite(clinical))
      throw new Error(`jointToQuaternion ${key} must be finite or null, but was ${clinical}`);
    let angle: number;
    if (clinical === null) angle = 0;
    else if (frame === undefined) angle = clinical;
    else {
      const read: ReturnType<typeof toRigAngle.prepare> =
        rigAngle ?? operation?.rigAngles?.[key] ?? toRigAngle.prepare();
      angle = read(clinical, frame) ?? 0;
      if (rigAngle === undefined && operation !== undefined) {
        operation.rigAngles ??= {};
        operation.rigAngles[key] = read;
      }
      rigAngle = read;
    }
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
