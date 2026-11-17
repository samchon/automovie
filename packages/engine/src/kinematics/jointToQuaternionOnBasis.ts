import {
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { multiplyQuaternionInto } from "../math/multiplyQuaternionInto";
import { IAutoMovieAxisFrame } from "../rom/IAutoMovieAxisFrame";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { toRigAngle } from "../rom/toRigAngle";
import { normalizeJointAxes } from "./normalizeJointAxes";
import { prepareJointRotationFactor } from "./prepareJointRotationFactor";

/** The three clinical coordinates, read in their existing admission order. */
type AutoMovieClinicalAxis = "flexion" | "abduction" | "twist";

/** One raw inner-product writer; its prepared form retains fixed axis support only. */
type IInnerProductWriter = ReturnType<typeof multiplyQuaternionInto.prepareCardinal>;

/** Fixed-basis composition with an optional current-call clinical frame. */
type IComposition = (
  joint: Pick<IAutoMovieJointPose, AutoMovieClinicalAxis>,
  currentFrame?: IAutoMovieRestFrame,
) => IAutoMovieQuaternion;

/** Actual completed raw components; no caller/query input is retained by a reader. */
type IRawReader = <Result, Context>(
  joint: Pick<IAutoMovieJointPose, AutoMovieClinicalAxis>,
  read: (x: number, y: number, z: number, w: number, context: Context) => Result,
  context: Context,
) => Result;

/** The same raw owner also accepts a call-local frame for ordinary mutable composition. */
type IRawComposition = <Result, Context>(
  joint: Pick<IAutoMovieJointPose, AutoMovieClinicalAxis>,
  read: (x: number, y: number, z: number, w: number, context: Context) => Result,
  context: Context,
  currentFrame?: IAutoMovieRestFrame,
) => Result;

/** Fixed direction/length readers for a genuine immutable normalizer output. */
type IDirectAxisReaders = Readonly<Record<
  AutoMovieClinicalAxis, ReturnType<typeof Quaternion.prepareAxisAngle>
>>;

/** Weak source-only preparation; no frame, angle, factor or target is retained. */
const DIRECT_AXIS_READERS: WeakMap<IAutoMovieJointAxes, IDirectAxisReaders> = new WeakMap();

/** Ordinary/accessor inputs retain all original direct axis reads/admission. */
function directAxisReaders(basis: IAutoMovieJointAxes): IDirectAxisReaders | undefined {
  if (!normalizeJointAxes.owns(basis)) return undefined;
  const known: IDirectAxisReaders | undefined = DIRECT_AXIS_READERS.get(basis);
  if (known !== undefined) return known;
  const readers: IDirectAxisReaders = {
    flexion: Quaternion.prepareAxisAngle(basis.flexion),
    abduction: Quaternion.prepareAxisAngle(basis.abduction),
    twist: Quaternion.prepareAxisAngle(basis.twist),
  };
  DIRECT_AXIS_READERS.set(basis, readers);
  return readers;
}

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
 * @evidence contracts/development/common.md#meaningful-documentation States prior basis admission, joint conventions/errors and invalid-basis behavior. Prepared children define fixed versus mutable frame lifetime, actual ordered admission/null bypass, bounded arithmetic and fresh output. prepareScalarQueries documents four completed raw components/context, synchronous one-visitor execution, no outer-record requirement and caller-owned results.
 * @evidence contracts/development/implementation.md#principled-implementation Three axis-angle factors keep their declared Euler/Hamilton association and affine inverse of toClinicalAngle. Genuine Cartesian support leaves one product per inner output and two per outer output in original order/sign; actual support/finite guards prove omitted terms signed zeros. Finite nonzero outputs are unchanged, while zero outputs keep complete original formulas. A declared outer identity likewise copies finite nonzero components and retains zero terms/order. Returned outputs stay fresh; unsupported/nonfinite products retain full formulas.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepared fresh/scalar entries share one raw composition owner and the factor companion's original F/A/T admission/conversion. Public composers use a static fresh-record constructor; score readers pass a synchronous visitor/context without pending slots. Inner scratch/outer scalars use their math owner and genuine support metadata with actual pair guards. Rig-only products stay immutable and jointToQuaternion still admits the basis first.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Null remains rig-zero rest and every nonfinite clinical number still throws before factor reuse. prepareMutable always calls direct toRigAngle after clinical admission, retaining every current sign/neutral read and null bypass; it never stores a frame or borrows fixed-affine admission. Sparse classification occurs after F/A/T admission only for normalizer-owned immutable bases; unowned/copy/accessor bases receive no extra axis probes. Actual off-axis zeros/finite inputs/products are rechecked, zero outputs keep complete original formulas and dense/nonfinite factors use the direct writer. No tolerance, unit shortcut, changed Hamilton association or omitted admission certifies algebra.
 * @evidence contracts/development/implementation.md#efficient-algorithms Direct genuine-owned bases share three lazy axis direction/length readers, omitting repeated norms while keeping direct clinical/frame admission. Prepared factors additionally share fixed affine work. Inner scratch replaces records; guarded cardinal products use four/eight products, with original zero/nonfinite formulas. Axis-local identity masks omit unrelated membership; scalar scoring avoids outer records and public composers stay fresh. Every finite check remains, with no added basis validation and runtime improvement unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Actual frame/clinical lookup and finite admission remain on every call. Direct genuine-owned bases share only immutable axis references/direction/length; ordinary/copy/accessor bases retain original direct reads. Fixed-frame entries share affine operands with replacements re-admitted, while mutable/direct calls always convert current frames. Initial/two-recent factors and unchanged inner operands share only within their composer. Query factories share three axis/affine readers, six declared factors/four products and source-only support metadata. Actual support guards remain; no dynamic factor/result enters source metadata. Scalar copies precede scratch mutation and mutable frames stay call-local for recursion/failure independence. Original sine/division/component grouping remains.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Direct calls add at most three source-only axis readers per genuine immutable basis in a weak map; raw inputs add none, and no frame/angle/factor/target enters that map. Composers own three factor closures/nine recent factors, one inner scratch and readers. Mutable frames remain call-local. Query factories own three axis/affine readers, six declared factors, three identity masks, four fixed products and two support readers. Scalar visitors/context stay on their call stack and outputs belong to callers. Weak source entries release with their basis; query/operation release frees other preparation, with no dynamic result retained across queries.
 */
export function jointToQuaternionOnBasis(
  joint: Pick<IAutoMovieJointPose, AutoMovieClinicalAxis>,
  basis: IAutoMovieJointAxes,
  frame?: IAutoMovieRestFrame,
): IAutoMovieQuaternion {
  const readers: IDirectAxisReaders | undefined = directAxisReaders(basis);
  const qFlexion: IAutoMovieQuaternion = readers === undefined
    ? Quaternion.fromAxisAngle(basis.flexion, readAngle(joint, "flexion", frame?.flexion))
    : readers.flexion(readAngle(joint, "flexion", frame?.flexion));
  const qAbduction: IAutoMovieQuaternion = readers === undefined
    ? Quaternion.fromAxisAngle(basis.abduction, readAngle(joint, "abduction", frame?.abduction))
    : readers.abduction(readAngle(joint, "abduction", frame?.abduction));
  const qTwist: IAutoMovieQuaternion = readers === undefined
    ? Quaternion.fromAxisAngle(basis.twist, readAngle(joint, "twist", frame?.twist))
    : readers.twist(readAngle(joint, "twist", frame?.twist));
  return basis.twistPlacement === "distal"
    ? Quaternion.multiply(qAbduction, Quaternion.multiply(qFlexion, qTwist))
    : Quaternion.multiply(qTwist, Quaternion.multiply(qAbduction, qFlexion));
}

/**
 * Query-owned dynamic factors and declared rig constants on unchanged axes/frame.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines unchanged basis/fixed-frame preparation versus current-call mutable frames, original ordered admission/null bypass, pure resolved-angle keys, bounded composer/rig metadata and fresh output ownership.
 * @evidence contracts/development/design.md#principled-representation An axis-angle factor depends only on its fixed admitted axis and exact resolved rig angle. Every entry resolves the actual clinical/frame input before factor reuse; fixed-frame entries may share immutable affine operands, while prepareMutable performs direct current-frame conversion. Object.is-equal resolved numbers and identical private inner operands therefore share pure arithmetic under the original Hamilton association. Genuine Cartesian support also defines source-only writer labels/sign, with every actual product guarded.
 * @evidence contracts/development/design.md#minimal-and-owned-surface prepare/prepareQueries serve fresh rotation consumers, prepareMutable serves raw FK's actual current frames, and prepareScalarQueries serves the actual projector's numeric score rows through four completed raw scalars. All use one raw composition owner; no quaternion injection, factor getter, result-control cache or global target store is exposed.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every actual joint keeps F/A/T axis/frame/value lookup and finite checks before factor reuse. Fixed-frame entries require unchanged affine values and re-admit replacement records; prepareMutable instead performs every direct current-frame admission, with null bypass and no retained frame. Constructor work admits no unused input. Only exact resolved numbers/private operands reuse arithmetic. Each composer owns nine pure initial/recent factors and one private inner scratch at most; shared rig state owns six declared factors/four inner products, three axis/affine readers and two support readers. Genuine normalizer provenance alone permits support classification; actual zero/finite guards and exact zero/nonfinite fallbacks remain. No descriptor, target-result key, tolerance or transformed Hamilton association certifies reuse; outer outputs stay fresh and caller lifetimes release all state.
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
   * Compose repeated actual records on one unchanged admitted basis while the
   * clinical frame may change, including edits to the same frame object.
   * Every call keeps F/A/T axis, current axis-frame and clinical-value reads,
   * finite admission and direct toRigAngle sign/neutral admission/arithmetic.
   * Null still bypasses sign/neutral reads. Only exact resolved-angle factors
   * and private inner storage are reused; no affine reading is retained.
   * The current frame is a call-local argument, never a closure field, so
   * return, failure and reentrant calls cannot retain or replace another call's
   * frame. Release the composer with its fixed-basis operation; outputs are fresh.
   */
  export function prepareMutable(basis: IAutoMovieJointAxes): IComposition {
    return preparedComposition(basis, undefined, undefined, true);
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
   * Genuine owned-basis inner/outer support readers may also share after their
   * first actual use; neither retains a factor or product result.
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

  /**
   * Prepare raw-scalar readers for actual candidate scoring on a fixed rig.
   * Every query owns independent factors/inner state and performs the original
   * F/A/T admission and Hamilton association before one synchronous visitor.
   * Only completed X/Y/Z/W and caller context enter that visitor; no temporary
   * outer quaternion, visitor, context, joint or target is retained.
   */
  export function prepareScalarQueries(
    basis: IAutoMovieJointAxes,
    frame?: IAutoMovieRestFrame,
    fixedAngles?: IFixedAngles,
  ): () => IRawReader {
    const operation: IOperationState = { axisReaders: {} };
    if (fixedAngles !== undefined) operation.fixedAngles = fixedAngles;
    return (): IRawReader => scalarComposition(basis, frame, operation);
  }
}

/** Fixed-rig metadata shared with the single scalar factor owner. */
type IOperationState = prepareJointRotationFactor.IOperation;

/** At most two lazy private declared factors for one axis. */
type IFixedReadings = prepareJointRotationFactor.IFixedReadings;

/** Fresh query state, optionally borrowing operation-owned rig arithmetic. */
function preparedComposition(
  basis: IAutoMovieJointAxes,
  frame?: IAutoMovieRestFrame,
  operation?: IOperationState,
  mutable: boolean = false,
): IComposition {
  const read: IRawComposition = scalarComposition(basis, frame, operation, mutable);
  return (joint: Pick<IAutoMovieJointPose, AutoMovieClinicalAxis>, currentFrame?: IAutoMovieRestFrame): IAutoMovieQuaternion =>
    read(joint, quaternionRecord, undefined, currentFrame);
}

/** Fresh public output after every original raw scalar expression has completed. */
function quaternionRecord(x: number, y: number, z: number, w: number): IAutoMovieQuaternion {
  return { x, y, z, w };
}

/** One composition owner for public fresh output and actual scalar-demand readers. */
function scalarComposition(
  basis: IAutoMovieJointAxes,
  frame?: IAutoMovieRestFrame,
  operation?: IOperationState,
  mutable: boolean = false,
): IRawComposition {
  const fixedOperation: IOperationState | undefined =
    operation?.fixedAngles === undefined ? undefined : operation;
  const flexion: prepareJointRotationFactor.IReader = prepareJointRotationFactor(
    "flexion", operation, mutable,
  );
  const abduction: prepareJointRotationFactor.IReader = prepareJointRotationFactor(
    "abduction", operation, mutable,
  );
  const twist: prepareJointRotationFactor.IReader = prepareJointRotationFactor(
    "twist", operation, mutable,
  );
  let innerLeft: IAutoMovieQuaternion | undefined;
  let innerRight: IAutoMovieQuaternion | undefined;
  let inner: IAutoMovieQuaternion | undefined;
  let dynamicInner: IAutoMovieQuaternion | undefined;
  let writeInner: IInnerProductWriter | undefined;
  let readOuter: typeof multiplyQuaternionInto.read | undefined;
  return <Result, Context>(
    joint: Pick<IAutoMovieJointPose, AutoMovieClinicalAxis>,
    read: (x: number, y: number, z: number, w: number, context: Context) => Result,
    context: Context,
    currentFrame?: IAutoMovieRestFrame,
  ): Result => {
    const actualFrame: IAutoMovieRestFrame | undefined = mutable ? currentFrame : frame;
    const qFlexion: IAutoMovieQuaternion = flexion(
      basis.flexion,
      actualFrame?.flexion,
      joint.flexion,
    );
    const qAbduction: IAutoMovieQuaternion = abduction(
      basis.abduction,
      actualFrame?.abduction,
      joint.abduction,
    );
    const qTwist: IAutoMovieQuaternion = twist(
      basis.twist,
      actualFrame?.twist,
      joint.twist,
    );
    const distal: boolean = basis.twistPlacement === "distal";
    const left: IAutoMovieQuaternion = distal ? qFlexion : qAbduction;
    const right: IAutoMovieQuaternion = distal ? qTwist : qFlexion;
    if (innerLeft !== left || innerRight !== right) {
      const shared: IAutoMovieQuaternion | undefined = fixedOperation === undefined
        ? undefined
        : fixedInnerProduct(fixedOperation, distal, left, right);
      if (shared !== undefined) inner = shared;
      else {
        if (dynamicInner === undefined)
          dynamicInner = Quaternion.multiply(left, right);
        else {
          if (writeInner === undefined) {
            writeInner = operation?.innerWriter ?? (normalizeJointAxes.owns(basis)
              ? multiplyQuaternionInto.prepareCardinal(
                  distal ? basis.flexion : basis.abduction,
                  distal ? basis.twist : basis.flexion,
                ) : multiplyQuaternionInto);
            if (operation !== undefined && operation.innerWriter === undefined)
              operation.innerWriter = writeInner;
          }
          writeInner(dynamicInner, left, right);
        }
        inner = dynamicInner;
      }
      innerLeft = left;
      innerRight = right;
    }
    const outer: IAutoMovieQuaternion = distal ? qAbduction : qTwist;
    const product: IAutoMovieQuaternion = inner!;

    // Identity's signed-zero terms leave nonzero finite components unchanged.
    // Zero components retain those exact terms/order to keep their zero sign.
    const outerAxis: AutoMovieClinicalAxis = distal ? "abduction" : "twist";
    const identities: number = operation?.identityMasks?.[outerAxis] ?? 0;
    const constants: IFixedReadings | undefined = identities === 0
      ? undefined : operation?.fixedFactors?.[outerAxis];
    if (constants !== undefined &&
      ((identities & 1) !== 0 && outer === constants[0] ||
        (identities & 2) !== 0 && outer === constants[1]) &&
      Number.isFinite(product.x + product.y + product.z + product.w)) {
      const x: number = product.x !== 0 ? product.x
        : product.x + outer.x * product.w + outer.y * product.z - outer.z * product.y;
      const y: number = product.y !== 0 ? product.y
        : product.y - outer.x * product.z + outer.y * product.w + outer.z * product.x;
      const z: number = product.z !== 0 ? product.z
        : product.z + outer.x * product.y - outer.y * product.x + outer.z * product.w;
      const w: number = product.w !== 0 ? product.w
        : product.w - outer.x * product.x - outer.y * product.y - outer.z * product.z;
      return read(x, y, z, w, context);
    }
    if (readOuter === undefined) {
      readOuter = operation?.outerReader ?? (normalizeJointAxes.owns(basis)
        ? multiplyQuaternionInto.prepareCardinalLeft(distal ? basis.abduction : basis.twist)
        : multiplyQuaternionInto.read);
      if (operation !== undefined && operation.outerReader === undefined)
        operation.outerReader = readOuter;
    }
    return readOuter(outer, product, read, context);
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

