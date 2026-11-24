import type {
  IAutoMovieAxisFrame,
  IAutoMovieQuaternion,
  IAutoMovieResolvedJointAngles,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { multiplyQuaternionInto } from "../math/multiplyQuaternionInto";
import { toRigAngle } from "../rom/toRigAngle";
import type { jointToQuaternionOnBasis } from "./jointToQuaternionOnBasis";

/** Clinical coordinates owned by the inverse's resolved-angle representation. */
type ClinicalAxis = keyof IAutoMovieResolvedJointAngles;

/**
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
  let reader: ReturnType<typeof Quaternion.prepareAxisAngle> | undefined;
  let rigAngle: ReturnType<typeof toRigAngle.prepare> | undefined;
  return (
    axis: IAutoMovieVector3,
    frame: IAutoMovieAxisFrame | undefined,
    clinical: number | null,
  ): IAutoMovieQuaternion => {
    let angle: number;
    if (mutable) angle = toRigAngle(clinical, frame) ?? 0;
    else if (clinical === null) angle = 0;
    else if (frame === undefined) angle = clinical;
    else {
      const read: ReturnType<typeof toRigAngle.prepare> =
        rigAngle ?? operation?.rigAngles?.[key] ?? toRigAngle.prepare();
      angle = read(clinical, frame) ?? 0;
      if (rigAngle === undefined) {
        if (operation !== undefined) {
          operation.rigAngles ??= {};
          operation.rigAngles[key] = read;
        }
        rigAngle = read;
      }
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
    const axisAngle: ReturnType<typeof Quaternion.prepareAxisAngle> =
      reader ??
      operation?.axisReaders[key] ??
      Quaternion.prepareAxisAngle(axis);
    const quaternion: IAutoMovieQuaternion =
      fixedOperation === undefined
        ? axisAngle(angle)
        : fixedFactor(fixedOperation, key, angle, axisAngle);
    if (reader === undefined) {
      if (operation !== undefined && operation.axisReaders[key] === undefined)
        operation.axisReaders[key] = axisAngle;
      reader = axisAngle;
    }
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
  operation: prepareJointRotationFactor.IOperation,
  key: ClinicalAxis,
  angle: number,
  read: ReturnType<typeof Quaternion.prepareAxisAngle>,
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
  const known: IAutoMovieQuaternion | undefined =
    operation.fixedFactors?.[key]?.[index];
  if (known !== undefined) return known;
  const quaternion: IAutoMovieQuaternion = read(angle);
  if (
    quaternion.x === 0 &&
    quaternion.y === 0 &&
    quaternion.z === 0 &&
    quaternion.w === 1
  ) {
    operation.identityMasks ??= {};
    operation.identityMasks[key] =
      (operation.identityMasks[key] ?? 0) | (1 << index);
  }
  operation.fixedFactors ??= {};
  const readings: prepareJointRotationFactor.IFixedReadings =
    (operation.fixedFactors[key] ??= []);
  readings[index] = quaternion;
  return quaternion;
}

/** Bounded fixed-rig preparation shared by independent actual query readers. */
export namespace prepareJointRotationFactor {
  /** Original axis/frame/clinical call order, after the caller's field lookups. */
  export type IReader = (
    axis: IAutoMovieVector3,
    frame: IAutoMovieAxisFrame | undefined,
    clinical: number | null,
  ) => IAutoMovieQuaternion;

  /** At most two lazy private factors for one axis's declared rig coordinates. */
  export type IFixedReadings = [IAutoMovieQuaternion?, IAutoMovieQuaternion?];

  /** Rig-only scalar/factor/product/support facts, never changing target data. */
  export interface IOperation {
    /** Three lazy original direction/length readers, populated after success. */
    axisReaders: Partial<
      Record<ClinicalAxis, ReturnType<typeof Quaternion.prepareAxisAngle>>
    >;
    /** Three actual-used successful immutable affine readers at most. */
    rigAngles?: Partial<
      Record<ClinicalAxis, ReturnType<typeof toRigAngle.prepare>>
    >;
    /** Borrowed immutable rig coordinates, at most two per axis. */
    fixedAngles?: jointToQuaternionOnBasis.IFixedAngles;
    /** Factors produced only at actual exact declared-angle matches. */
    fixedFactors?: Partial<Record<ClinicalAxis, IFixedReadings>>;
    /** At most four products of two actual private declared factors. */
    fixedInnerProducts?: IAutoMovieQuaternion[];
    /** Two identity bits per axis among its actual declared factors. */
    identityMasks?: Partial<Record<ClinicalAxis, number>>;
    /** Source-only distinct-support metadata; no actual factors/results. */
    innerWriter?: ReturnType<typeof multiplyQuaternionInto.prepareCardinal>;
    /** Source-only cardinal-left support; no actual factors/results. */
    outerReader?: typeof multiplyQuaternionInto.read;
  }
}
