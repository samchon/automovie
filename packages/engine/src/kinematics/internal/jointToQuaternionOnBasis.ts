import type {
  AutoMovieClinicalAxis,
  IAutoMovieAxisFrame,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
  IAutoMovieRestFrame,
} from "@automovie/interface";

import { Quaternion } from "../../math/Quaternion";
import { multiplyQuaternionInto } from "../../math/internal/multiplyQuaternionInto";
import { AutoMovieEngineRigAngle } from "../../rom/internal/AutoMovieEngineRigAngle";
import { normalizeJointAxes } from "./normalizeJointAxes";
import { prepareJointRotationFactor } from "./prepareJointRotationFactor";

/*
 * Preserve null rest, angle admission and the caller's clinical frame map.
 */
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

  return AutoMovieEngineRigAngle.toRigAngle(value, frame) ?? 0;
};

/*
 * jointToQuaternion on a basis its caller already admitted and
 * normalized through normalizeJointAxes: the composition itself, with no
 * validation of the basis.
 *
 * A solver that composes hundreds of candidate joints through one basis
 * normalizes it once and calls this for each, as
 * `decomposeJointRotationOnBasis` serves the inverse. The axes, the declared
 * composition orders, the `null` rest and the frame map are
 * `jointToQuaternion`'s, which documents them and is this function behind one
 * normalization.
 *
 * Throws on a non-finite angle or an invalid frame sign or neutral. A basis
 * that is not orthonormal composes a quaternion that is not the joint's
 * rotation; nothing here detects it.
 * Parameter joint: Clinical angles in degrees; `null` axes are at rest.
 * Parameter basis: Orthonormal clinical axis basis, as `normalizeJointAxes` returns
 * it.
 * Parameter frame: Rest frame mapping clinical angles to rest-relative ones;
 * omitted, the angles are already rest-relative.
 */
export namespace jointToQuaternionOnBasis {
  /*
   * Compose clinical joint angles into a basis rotation quaternion.
   */
  export function run(
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
    if (basis.rotationOrder === "flexion-abduction-twist")
      return Quaternion.multiply(
        qFlexion,
        Quaternion.multiply(qAbduction, qTwist),
      );
    return basis.twistPlacement === "distal"
      ? Quaternion.multiply(qAbduction, Quaternion.multiply(qFlexion, qTwist))
      : Quaternion.multiply(qTwist, Quaternion.multiply(qAbduction, qFlexion));
  }

  /*
   * Query-owned dynamic factors and declared rig constants on unchanged
   * axes/frame.
   */

  /*
   * At most two unchanged, predeclared rig angles per axis; never target
   * readings.
   */
  export type IFixedAngles = Partial<
    Record<AutoMovieClinicalAxis, readonly [number] | readonly [number, number]>
  >;

  /*
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

  /*
   * Compose repeated actual records on one unchanged admitted basis while the
   * clinical frame may change, including edits to the same frame object. Every
   * call keeps F/A/T axis, current axis-frame and clinical-value reads, finite
   * admission and direct toRigAngle sign/neutral admission/arithmetic. Null
   * still bypasses sign/neutral reads. Only exact resolved-angle factors and
   * private inner storage are reused; no affine reading is retained. The
   * current frame is a call-local argument, never a closure field, so return,
   * failure and reentrant calls cannot retain or replace another call's frame.
   * Release the composer with its fixed-basis operation; outputs are fresh.
   */
  export function prepareMutable(basis: IAutoMovieJointAxes): IComposition {
    return preparedComposition(basis, undefined, undefined, true);
  }

  /*
   * Prepare independent query composers on one unchanged admitted basis/frame.
   * Construction reads no axis or joint. The first successful factor on each
   * axis prepares its original rescaled direction/length. Optional fixedAngles
   * are the rig's unchanged resolved numbers, not clinical coordinates or query
   * answers: only an exact finite match lazily shares that private pure factor.
   * Two actual private declared factors may also share their inner product, at
   * most four combinations. Other factors and dynamic inner slots remain fresh
   * per query. Keep basis, frame and declarations unchanged; release the
   * factory and its composers with the operation. No complete target rotation
   * survives a query. Up to three actual-used nonnull affine frame readers also
   * share this rig's original first-use admission/scalars; every query keeps
   * angle checks and frame lookup order, with replacement frames admitted
   * normally. Genuine owned-basis inner/outer support readers may also share
   * after their first actual use; neither retains a factor or product result.
   */
  export function prepareQueries(
    basis: IAutoMovieJointAxes,
    frame?: IAutoMovieRestFrame,
    fixedAngles?: IFixedAngles,
  ): () => ReturnType<typeof prepare> {
    const operation: IOperationState = prepareJointRotationFactor.operation(
      basis,
      fixedAngles,
    );
    return (): ReturnType<typeof prepare> =>
      preparedComposition(basis, frame, operation);
  }

  /*
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
    const operation: IOperationState = prepareJointRotationFactor.operation(
      basis,
      fixedAngles,
    );
    return (): IRawReader => scalarComposition(basis, frame, operation);
  }
}

/*
 * Fresh query state, optionally borrowing operation-owned rig arithmetic.
 */
function preparedComposition(
  basis: IAutoMovieJointAxes,
  frame?: IAutoMovieRestFrame,
  operation?: IOperationState,
  mutable: boolean = false,
): IComposition {
  const read: IRawComposition = scalarComposition(
    basis,
    frame,
    operation,
    mutable,
  );
  return (
    joint: Pick<IAutoMovieJointPose, AutoMovieClinicalAxis>,
    currentFrame?: IAutoMovieRestFrame,
  ): IAutoMovieQuaternion =>
    read(joint, quaternionRecord, undefined, currentFrame);
}

/*
 * Fresh public output after every original raw scalar expression has completed.
 */
function quaternionRecord(
  x: number,
  y: number,
  z: number,
  w: number,
): IAutoMovieQuaternion {
  return { x, y, z, w };
}

/*
 * One composition owner for public fresh output and actual scalar-demand
 * readers.
 */
function scalarComposition(
  basis: IAutoMovieJointAxes,
  frame?: IAutoMovieRestFrame,
  operation?: IOperationState,
  mutable: boolean = false,
): IRawComposition {
  const fixedOperation: IOperationState | undefined =
    operation?.fixedAngles === undefined ? undefined : operation;
  const flexion: prepareJointRotationFactor.IReader =
    prepareJointRotationFactor("flexion", operation, mutable);
  const abduction: prepareJointRotationFactor.IReader =
    prepareJointRotationFactor("abduction", operation, mutable);
  const twist: prepareJointRotationFactor.IReader = prepareJointRotationFactor(
    "twist",
    operation,
    mutable,
  );
  let innerLeft: IAutoMovieQuaternion | undefined;
  let innerRight: IAutoMovieQuaternion | undefined;
  let inner: IAutoMovieQuaternion | undefined;
  let dynamicInner: IAutoMovieQuaternion | undefined;
  return <Result, Context>(
    joint: Pick<IAutoMovieJointPose, AutoMovieClinicalAxis>,
    read: (
      x: number,
      y: number,
      z: number,
      w: number,
      context: Context,
    ) => Result,
    context: Context,
    currentFrame?: IAutoMovieRestFrame,
  ): Result => {
    const actualFrame: IAutoMovieRestFrame | undefined = mutable
      ? currentFrame
      : frame;
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
    const flexionFirst: boolean =
      basis.rotationOrder === "flexion-abduction-twist";
    const distal: boolean = !flexionFirst && basis.twistPlacement === "distal";
    const innerLeftAxis: AutoMovieClinicalAxis = distal
      ? "flexion"
      : "abduction";
    const innerRightAxis: AutoMovieClinicalAxis =
      distal || flexionFirst ? "twist" : "flexion";
    const left: IAutoMovieQuaternion = distal ? qFlexion : qAbduction;
    const right: IAutoMovieQuaternion =
      distal || flexionFirst ? qTwist : qFlexion;
    if (innerLeft !== left || innerRight !== right) {
      const shared: IAutoMovieQuaternion | undefined =
        fixedOperation === undefined
          ? undefined
          : fixedInnerProduct(
              fixedOperation,
              innerLeftAxis,
              innerRightAxis,
              left,
              right,
            );
      if (shared !== undefined) inner = shared;
      else {
        if (dynamicInner === undefined)
          dynamicInner = Quaternion.multiply(left, right);
        else multiplyQuaternionInto(dynamicInner, left, right);
        inner = dynamicInner;
      }
      innerLeft = left;
      innerRight = right;
    }
    const outer: IAutoMovieQuaternion = flexionFirst
      ? qFlexion
      : distal
        ? qAbduction
        : qTwist;
    const product: IAutoMovieQuaternion = inner!;

    // Identity's signed-zero terms leave nonzero finite components unchanged.
    // Zero components retain those exact terms/order to keep their zero sign.
    const outerAxis: AutoMovieClinicalAxis = flexionFirst
      ? "flexion"
      : distal
        ? "abduction"
        : "twist";
    const identities: number = operation?.identityMasks?.[outerAxis] ?? 0;
    const constants: IFixedReadings | undefined =
      identities === 0 ? undefined : operation?.fixedFactors?.[outerAxis];
    if (
      constants !== undefined &&
      (((identities & 1) !== 0 && outer === constants[0]) ||
        ((identities & 2) !== 0 && outer === constants[1]))
    ) {
      const x: number =
        product.x !== 0
          ? product.x
          : product.x +
            outer.x * product.w +
            outer.y * product.z -
            outer.z * product.y;
      const y: number =
        product.y !== 0
          ? product.y
          : product.y -
            outer.x * product.z +
            outer.y * product.w +
            outer.z * product.x;
      const z: number =
        product.z !== 0
          ? product.z
          : product.z +
            outer.x * product.y -
            outer.y * product.x +
            outer.z * product.w;
      const w: number =
        product.w !== 0
          ? product.w
          : product.w -
            outer.x * product.x -
            outer.y * product.y -
            outer.z * product.z;
      return read(x, y, z, w, context);
    }
    return multiplyQuaternionInto.read(outer, product, read, context);
  };
}

/*
 * Share the original product only when both actual factors are rig constants.
 */
function fixedInnerProduct(
  operation: IOperationState,
  leftAxis: AutoMovieClinicalAxis,
  rightAxis: AutoMovieClinicalAxis,
  left: IAutoMovieQuaternion,
  right: IAutoMovieQuaternion,
): IAutoMovieQuaternion | undefined {
  const leftFactors: IFixedReadings | undefined =
    operation.fixedFactors?.[leftAxis];
  const rightFactors: IFixedReadings | undefined =
    operation.fixedFactors?.[rightAxis];
  const leftIndex: number =
    leftFactors === undefined
      ? -1
      : left === leftFactors[0]
        ? 0
        : left === leftFactors[1]
          ? 1
          : -1;
  const rightIndex: number =
    rightFactors === undefined
      ? -1
      : right === rightFactors[0]
        ? 0
        : right === rightFactors[1]
          ? 1
          : -1;
  if (leftIndex < 0 || rightIndex < 0) return undefined;
  const index: number = leftIndex * 2 + rightIndex;
  return operation.fixedInnerProducts?.[index];
}

/*
 * The three clinical coordinates, read in their existing admission order.
 */

/*
 * Fixed-basis composition with an optional current-call clinical frame.
 */
type IComposition = (
  joint: Pick<IAutoMovieJointPose, AutoMovieClinicalAxis>,
  currentFrame?: IAutoMovieRestFrame,
) => IAutoMovieQuaternion;

/*
 * Actual completed raw components; no caller/query input is retained by a
 * reader.
 */
type IRawReader = <Result, Context>(
  joint: Pick<IAutoMovieJointPose, AutoMovieClinicalAxis>,
  read: (
    x: number,
    y: number,
    z: number,
    w: number,
    context: Context,
  ) => Result,
  context: Context,
) => Result;

/*
 * The same raw owner also accepts a call-local frame for ordinary mutable
 * composition.
 */
type IRawComposition = <Result, Context>(
  joint: Pick<IAutoMovieJointPose, AutoMovieClinicalAxis>,
  read: (
    x: number,
    y: number,
    z: number,
    w: number,
    context: Context,
  ) => Result,
  context: Context,
  currentFrame?: IAutoMovieRestFrame,
) => Result;

/*
 * Fixed-rig metadata shared with the single scalar factor owner.
 */
type IOperationState = prepareJointRotationFactor.IOperation;

/*
 * At most two lazy private declared factors for one axis.
 */
type IFixedReadings = prepareJointRotationFactor.IFixedReadings;
