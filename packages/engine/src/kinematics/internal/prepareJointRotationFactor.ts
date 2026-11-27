import type {
  IAutoMovieAxisFrame,
  IAutoMovieJointAxes,
  IAutoMovieQuaternion,
  IAutoMovieResolvedJointAngles,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineQuaternion } from "../../math/AutoMovieEngineQuaternion";
import { AutoMovieEngineRigAngle } from "../../rom/internal/AutoMovieEngineRigAngle";
import type { jointToQuaternionOnBasis } from "./jointToQuaternionOnBasis";

/*
 * Prepare one query's admitted clinical-to-axis-angle factor on a fixed axis.
 * Every call first checks the current clinical value. Fixed-frame readers may
 * share their successful affine operands; mutable readers always run direct
 * toRigAngle, including its current frame reads and null bypass. Constructor
 * work reads no axis, frame or clinical input.
 */
export function prepareJointRotationFactor(
  key: ClinicalAxis,
  operation: prepareJointRotationFactor.IOperation | undefined,
  mutable: boolean,
): prepareJointRotationFactor.IReader {
  const fixedOperation: prepareJointRotationFactor.IOperation | undefined =
    operation?.fixedAngles === undefined ? undefined : operation;
  let currentAngle: number | undefined;
  let current: IAutoMovieQuaternion | undefined;
  let initialAngle: number | undefined;
  let initial: IAutoMovieQuaternion | undefined;
  let previousAngle: number | undefined;
  let previous: IAutoMovieQuaternion | undefined;
  let reader: ReturnType<typeof AutoMovieEngineQuaternion.prepareAxisAngle> | undefined;
  let rigAngle: ReturnType<typeof AutoMovieEngineRigAngle.prepareToRigAngle> | undefined;
  return (
    axis: IAutoMovieVector3,
    frame: IAutoMovieAxisFrame | undefined,
    clinical: number | null,
  ): IAutoMovieQuaternion => {
    let angle: number;
    if (mutable) angle = AutoMovieEngineRigAngle.toRigAngle(clinical, frame) ?? 0;
    else if (clinical === null) angle = 0;
    else if (frame === undefined) angle = clinical;
    else {
      const read: ReturnType<typeof AutoMovieEngineRigAngle.prepareToRigAngle> =
        rigAngle ?? operation?.rigAngles[key] ?? AutoMovieEngineRigAngle.prepareToRigAngle();
      angle = read(clinical, frame) ?? 0;
      rigAngle = read;
    }
    if (current !== undefined && Object.is(currentAngle, angle)) return current;
    const reused: IAutoMovieQuaternion | undefined =
      previous !== undefined && Object.is(previousAngle, angle)
        ? previous
        : initial !== undefined && Object.is(initialAngle, angle)
          ? initial
          : undefined;
    if (reused !== undefined) {
      previousAngle = currentAngle;
      previous = current;
      currentAngle = angle;
      current = reused;
      return reused;
    }
    const axisAngle: ReturnType<typeof AutoMovieEngineQuaternion.prepareAxisAngle> =
      reader ??
      operation?.axisReaders[key] ??
      AutoMovieEngineQuaternion.prepareAxisAngle(axis);
    const quaternion: IAutoMovieQuaternion =
      fixedOperation === undefined
        ? axisAngle(angle)
        : fixedFactor(fixedOperation, key, angle, axisAngle);
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

/*
 * Bounded fixed-rig preparation shared by independent actual query readers.
 */
export namespace prepareJointRotationFactor {
  /*
   * Original axis/frame/clinical call order, after the caller's field lookups.
   */
  export type IReader = (
    axis: IAutoMovieVector3,
    frame: IAutoMovieAxisFrame | undefined,
    clinical: number | null,
  ) => IAutoMovieQuaternion;

  /*
   * At most two lazy private factors for one axis's declared rig coordinates.
   */
  export type IFixedReadings = [IAutoMovieQuaternion?, IAutoMovieQuaternion?];

  /*
   * Rig-only scalar/factor/product facts, never changing target data.
   */
  export interface IOperation {
    /*
     * The three direction/length readers of the basis.
     */
    readonly axisReaders: Record<
      ClinicalAxis,
      ReturnType<typeof AutoMovieEngineQuaternion.prepareAxisAngle>
    >;
    /*
     * The three immutable affine readers.
     */
    readonly rigAngles: Record<
      ClinicalAxis,
      ReturnType<typeof AutoMovieEngineRigAngle.prepareToRigAngle>
    >;
    /*
     * Borrowed immutable rig coordinates, at most two per axis.
     */
    fixedAngles?: jointToQuaternionOnBasis.IFixedAngles;
    /*
     * The factors of the declared angles, at most two per axis.
     */
    fixedFactors?: Partial<Record<ClinicalAxis, IFixedReadings>>;
    /*
     * At most four products of two declared factors.
     */
    fixedInnerProducts?: IAutoMovieQuaternion[];
    /*
     * Two identity bits per axis among its declared factors.
     */
    identityMasks?: Partial<Record<ClinicalAxis, number>>;
  }

  /*
   * Prepare a basis's rig-only facts: its readers and, for declared rig angles,
   * their factors, identity bits and inner products.
   */
  export function operation(
    basis: IAutoMovieJointAxes,
    fixedAngles?: jointToQuaternionOnBasis.IFixedAngles,
  ): IOperation {
    const axisReaders: IOperation["axisReaders"] = {
      flexion: AutoMovieEngineQuaternion.prepareAxisAngle(basis.flexion),
      abduction: AutoMovieEngineQuaternion.prepareAxisAngle(basis.abduction),
      twist: AutoMovieEngineQuaternion.prepareAxisAngle(basis.twist),
    };
    const prepared: IOperation = {
      axisReaders,
      rigAngles: {
        flexion: AutoMovieEngineRigAngle.prepareToRigAngle(),
        abduction: AutoMovieEngineRigAngle.prepareToRigAngle(),
        twist: AutoMovieEngineRigAngle.prepareToRigAngle(),
      },
    };
    if (fixedAngles === undefined) return prepared;
    prepared.fixedAngles = fixedAngles;
    const fixedFactors: Partial<Record<ClinicalAxis, IFixedReadings>> = {};
    const identityMasks: Partial<Record<ClinicalAxis, number>> = {};
    for (const key of ["flexion", "abduction", "twist"] as const) {
      const declared: jointToQuaternionOnBasis.IFixedAngles[ClinicalAxis] =
        fixedAngles[key];
      if (declared === undefined) continue;
      const readings: IFixedReadings = [];
      declared.forEach((angle: number, index: number): void => {
        const quaternion: IAutoMovieQuaternion = axisReaders[key](angle);
        readings[index] = quaternion;
        if (
          quaternion.x === 0 &&
          quaternion.y === 0 &&
          quaternion.z === 0 &&
          quaternion.w === 1
        )
          identityMasks[key] = (identityMasks[key] ?? 0) | (1 << index);
      });
      fixedFactors[key] = readings;
    }
    prepared.fixedFactors = fixedFactors;
    prepared.identityMasks = identityMasks;

    // The inner product is the left axis's factor times the right axis's.
    const flexionFirst: boolean =
      basis.rotationOrder === "flexion-abduction-twist";
    const distal: boolean = !flexionFirst && basis.twistPlacement === "distal";
    const left: IFixedReadings | undefined =
      fixedFactors[distal ? "flexion" : "abduction"];
    const right: IFixedReadings | undefined =
      fixedFactors[distal || flexionFirst ? "twist" : "flexion"];
    const products: IAutoMovieQuaternion[] = [];
    if (left !== undefined && right !== undefined)
      for (let l: number = 0; l < 2; ++l)
        for (let r: number = 0; r < 2; ++r)
          if (left[l] !== undefined && right[r] !== undefined)
            products[l * 2 + r] = AutoMovieEngineQuaternion.multiply(left[l]!, right[r]!);
    prepared.fixedInnerProducts = products;
    return prepared;
  }
}

/*
 * Share only an exact actual match to a finite rig-declared constant.
 */
function fixedFactor(
  operation: prepareJointRotationFactor.IOperation,
  key: ClinicalAxis,
  angle: number,
  read: ReturnType<typeof AutoMovieEngineQuaternion.prepareAxisAngle>,
): IAutoMovieQuaternion {
  const declared: jointToQuaternionOnBasis.IFixedAngles[ClinicalAxis] =
    operation.fixedAngles?.[key];
  if (declared === undefined) return read(angle);
  const index: 0 | 1 | null = Object.is(angle, declared[0])
    ? 0
    : declared.length === 2 && Object.is(angle, declared[1])
      ? 1
      : null;
  if (index === null) return read(angle);
  return operation.fixedFactors?.[key]?.[index] ?? read(angle);
}

/*
 * Clinical coordinates owned by the inverse's resolved-angle representation.
 */
type ClinicalAxis = keyof IAutoMovieResolvedJointAngles;
