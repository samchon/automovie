import type {
  AutoMovieHumanoidBone,
  IAutoMovieAxisFrame,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
  IAutoMovieRestFrame,
} from "@automovie/interface";

import { toRigAngle } from "../rom/toRigAngle";
import { jointToQuaternionOnBasis } from "./jointToQuaternionOnBasis";
import { normalizeJointAxes } from "./normalizeJointAxes";
import type { preparePoseResolutionChanges } from "./preparePoseResolutionChanges";

/**
 * One query's scalar composer of a convention
 * (`jointToQuaternionOnBasis.prepareScalarQueries`).
 */
type IComposer = ReturnType<
  ReturnType<typeof jointToQuaternionOnBasis.prepareScalarQueries>
>;

/** The most recent successful conversion of one authored bone name. */
interface IReading {
  /** Static convention selected from the actual immutable rig. */
  convention: preparePoseJointResolution.IConvention;

  /** Rooted index, absent for stray or unreachable authored names. */
  index: number | undefined;

  /** Actual last admitted clinical coordinates, in degrees or null rest. */
  flexion: number | null;
  abduction: number | null;
  twist: number | null;

  /**
   * The record those coordinates were admitted from, a value from then on;
   * absent for staged scalars.
   */
  record: IAutoMovieJointPose | undefined;

  /** The last successful conversion's quaternion components. */
  x: number;
  y: number;
  z: number;
  w: number;

  /** The reading's own scalar composer. */
  compose: IComposer;

  /** Latest scan that actually authored this name. */
  epoch: number;

  /**
   * The successful conversion before the last one, with its exact clinical
   * coordinates. One operation reads a pose and its mirror image, or a pose and
   * the same pose with one limb fitted, in turn, and a single row would convert
   * every joint again at each turn; absent until a second distinct tuple is
   * admitted.
   */
  before?: {
    flexion: number | null;
    abduction: number | null;
    twist: number | null;
    record: IAutoMovieJointPose | undefined;
    x: number;
    y: number;
    z: number;
    w: number;
  };
}

/** Null clinical rest genuinely resolves to this exact positive-zero rig angle. */
const REST_ANGLE: readonly [number] = [0];

/**
 * Immutable rig declarations share only factors actually requested at exact rig
 * rest.
 */
const REST_ANGLES: jointToQuaternionOnBasis.IFixedAngles = {
  flexion: REST_ANGLE,
  abduction: REST_ANGLE,
  twist: REST_ANGLE,
};

/** The composer's four components, written by `store` and read at once. */
interface ISink {
  x: number;
  y: number;
  z: number;
  w: number;
}

/** Write a composed quaternion's components into the sink. */
function store(x: number, y: number, z: number, w: number, sink: ISink): void {
  sink.x = x;
  sink.y = y;
  sink.z = z;
  sink.w = w;
}

/**
 * Admit changing ordered joint records on one genuine immutable prepared rig.
 *
 * Static conventions own lazy successful basis, fixed-axis scalar and affine
 * preparations. Each operation/name owns its independent scalar composer, exact
 * clinical tuple and last quaternion's four components, with the tuple and
 * components before them: a tuple equal to either shares its completed
 * conversion, so an operation that reads two poses in turn (a pose and its
 * mirror image, a pose before and after one limb's fit) converts each joint
 * once a pose instead of once a read. A conversion is the convention's scalar
 * composer (`jointToQuaternionOnBasis.prepareScalarQueries`), the same
 * expressions as the record composer, writing its four components into the
 * reading, so a conversion makes no quaternion record. An admitted record is a
 * value (`prepareSkeletonPoseResolution`: no one edits a record after its
 * admission), so the record a row was admitted from, last or before, stands for
 * its coordinates when it is read again and is not read a second time. begin
 * starts current membership; admit validates every other record before sharing
 * completed math; rotation copies the last admitted quaternion into a fresh
 * record for a reader that asks for one. snapshot is used only after the
 * producer's complete source scan and writes the last current quaternion of
 * every rooted node into a fixed baseline's rows.
 */
export function preparePoseJointResolution(
  indices: ReadonlyMap<AutoMovieHumanoidBone, number>,
  conventions: ReadonlyMap<string, preparePoseJointResolution.IConvention>,
  fallback: preparePoseJointResolution.IConvention,
  changes: preparePoseResolutionChanges.ITracker,
): preparePoseJointResolution.IReader {
  let epoch: number = 0;
  const joints: Map<AutoMovieHumanoidBone, IReading> = new Map();
  const byNode: (IReading | undefined)[] = [];
  let last: IReading | undefined;

  // The clinical tuple a conversion reads and the components it writes: one
  // record each for the operation, filled and read within one conversion.
  const tuple: {
    flexion: number | null;
    abduction: number | null;
    twist: number | null;
  } = { flexion: null, abduction: null, twist: null };
  const sink: ISink = { x: 0, y: 0, z: 0, w: 1 };
  return {
    begin: (): void => {
      ++epoch;
      changes.begin();
    },
    admit: (joint: IAutoMovieJointPose): void => {
      const known: IReading | undefined = joints.get(joint.bone);

      // An admitted record is a value: no one edits it afterwards, so the
      // record last admitted, or the one before it, is read again as the
      // conversion it was admitted as, without reading its coordinates.
      if (known !== undefined) {
        if (known.record === joint) {
          known.epoch = epoch;
          last = known;
          changes.write(known.index, known.x, known.y, known.z, known.w);
          return;
        }
        const before: IReading["before"] = known.before;
        if (before !== undefined && before.record === joint) {
          exchange(
            known,
            before,
            before.flexion,
            before.abduction,
            before.twist,
            joint,
          );
          return;
        }
      }
      const convention: preparePoseJointResolution.IConvention =
        known?.convention ?? conventions.get(joint.bone) ?? fallback;
      const basis: IAutoMovieJointAxes = (convention.basis ??=
        normalizeJointAxes(convention.axes, "jointToQuaternion axes"));
      const flexion: number | null = clinical(
        joint,
        "flexion",
        convention.frame?.flexion,
        known?.flexion,
        convention,
      );
      const abduction: number | null = clinical(
        joint,
        "abduction",
        convention.frame?.abduction,
        known?.abduction,
        convention,
      );
      const twist: number | null = clinical(
        joint,
        "twist",
        convention.frame?.twist,
        known?.twist,
        convention,
      );
      finish(
        joint,
        boneOf,
        known,
        convention,
        basis,
        flexion,
        abduction,
        twist,
        joint,
      );
    },
    rotation: (): IAutoMovieQuaternion => ({
      x: last!.x,
      y: last!.y,
      z: last!.z,
      w: last!.w,
    }),
    admitValues: (
      bone: AutoMovieHumanoidBone,
      f: number | null,
      a: number | null,
      t: number | null,
    ): void => {
      const known: IReading | undefined = joints.get(bone);
      const convention: preparePoseJointResolution.IConvention =
        known?.convention ?? conventions.get(bone) ?? fallback;
      const basis: IAutoMovieJointAxes = (convention.basis ??=
        normalizeJointAxes(convention.axes, "jointToQuaternion axes"));
      const flexion: number | null = clinicalValue(
        f,
        "flexion",
        convention.frame?.flexion,
        known?.flexion,
        convention,
      );
      const abduction: number | null = clinicalValue(
        a,
        "abduction",
        convention.frame?.abduction,
        known?.abduction,
        convention,
      );
      const twist: number | null = clinicalValue(
        t,
        "twist",
        convention.frame?.twist,
        known?.twist,
        convention,
      );
      finish(
        bone,
        stagedBone,
        known,
        convention,
        basis,
        flexion,
        abduction,
        twist,
        undefined,
      );
    },
    validateValues: (
      bone: AutoMovieHumanoidBone,
      f: number | null,
      a: number | null,
      t: number | null,
    ): void => {
      const known: IReading | undefined = joints.get(bone);
      const convention: preparePoseJointResolution.IConvention =
        known?.convention ?? conventions.get(bone) ?? fallback;
      convention.basis ??= normalizeJointAxes(
        convention.axes,
        "jointToQuaternion axes",
      );
      clinicalValue(
        f,
        "flexion",
        convention.frame?.flexion,
        known?.flexion,
        convention,
      );
      clinicalValue(
        a,
        "abduction",
        convention.frame?.abduction,
        known?.abduction,
        convention,
      );
      clinicalValue(
        t,
        "twist",
        convention.frame?.twist,
        known?.twist,
        convention,
      );
    },
    snapshot: (rows: Float64Array): void => {
      for (let index: number = 0; index < byNode.length; ++index) {
        const joint: IReading | undefined = byNode[index];
        if (joint === undefined || joint.epoch !== epoch) continue;
        const row: number = 4 * index;
        rows[row] = joint.x;
        rows[row + 1] = joint.y;
        rows[row + 2] = joint.z;
        rows[row + 3] = joint.w;
      }
    },
  };

  /**
   * The conversion before the last becomes the last, admitted from `record`,
   * and the last the one before.
   */
  function exchange(
    known: IReading,
    before: NonNullable<IReading["before"]>,
    flexion: number | null,
    abduction: number | null,
    twist: number | null,
    record: IAutoMovieJointPose | undefined,
  ): void {
    const x: number = before.x;
    const y: number = before.y;
    const z: number = before.z;
    const w: number = before.w;
    before.flexion = known.flexion;
    before.abduction = known.abduction;
    before.twist = known.twist;
    before.record = known.record;
    before.x = known.x;
    before.y = known.y;
    before.z = known.z;
    before.w = known.w;
    known.flexion = flexion;
    known.abduction = abduction;
    known.twist = twist;
    known.record = record;
    known.x = x;
    known.y = y;
    known.z = z;
    known.w = w;
    known.epoch = epoch;
    last = known;
    changes.write(known.index, x, y, z, w);
  }

  /**
   * Commit one actually admitted reading; name getters stay at their original
   * miss-only sites.
   */
  function finish<T>(
    source: T,
    nameOf: (source: T) => AutoMovieHumanoidBone,
    known: IReading | undefined,
    convention: preparePoseJointResolution.IConvention,
    basis: IAutoMovieJointAxes,
    flexion: number | null,
    abduction: number | null,
    twist: number | null,
    record: IAutoMovieJointPose | undefined,
  ): void {
    if (
      known !== undefined &&
      Object.is(known.flexion, flexion) &&
      Object.is(known.abduction, abduction) &&
      Object.is(known.twist, twist)
    ) {
      known.record = record;
      known.epoch = epoch;
      last = known;
      changes.write(known.index, known.x, known.y, known.z, known.w);
      return;
    }

    // The tuple before the last one: its completed components are the same
    // pure conversion of the same exact coordinates, so the two rows change
    // places and nothing is composed.
    const before: IReading["before"] = known?.before;
    if (
      known !== undefined &&
      before !== undefined &&
      Object.is(before.flexion, flexion) &&
      Object.is(before.abduction, abduction) &&
      Object.is(before.twist, twist)
    ) {
      exchange(known, before, flexion, abduction, twist, record);
      return;
    }
    const compose: IComposer =
      known?.compose ??
      (convention.queries ??= jointToQuaternionOnBasis.prepareScalarQueries(
        basis,
        convention.frame,
        REST_ANGLES,
      ))();
    tuple.flexion = flexion;
    tuple.abduction = abduction;
    tuple.twist = twist;
    compose(tuple, store, sink);
    if (known === undefined) {
      const reading: IReading = {
        convention,
        index: indices.get(nameOf(source)),
        flexion,
        abduction,
        twist,
        record,
        x: sink.x,
        y: sink.y,
        z: sink.z,
        w: sink.w,
        compose,
        epoch,
      };
      joints.set(nameOf(source), reading);
      if (reading.index !== undefined) byNode[reading.index] = reading;
      last = reading;
      changes.write(reading.index, reading.x, reading.y, reading.z, reading.w);
      return;
    }
    if (before === undefined)
      known.before = {
        flexion: known.flexion,
        abduction: known.abduction,
        twist: known.twist,
        record: known.record,
        x: known.x,
        y: known.y,
        z: known.z,
        w: known.w,
      };
    else {
      before.flexion = known.flexion;
      before.abduction = known.abduction;
      before.twist = known.twist;
      before.record = known.record;
      before.x = known.x;
      before.y = known.y;
      before.z = known.z;
      before.w = known.w;
    }
    known.flexion = flexion;
    known.abduction = abduction;
    known.twist = twist;
    known.record = record;
    known.x = sink.x;
    known.y = sink.y;
    known.z = sink.z;
    known.w = sink.w;
    known.epoch = epoch;
    last = known;
    changes.write(known.index, known.x, known.y, known.z, known.w);
  }
}

/** Internal immutable conventions and actual-admission operation reader. */
export namespace preparePoseJointResolution {
  /**
   * Actual immutable clinical inputs and bounded lazy preparation from
   * successful use.
   */
  export interface IConvention {
    /** Own-data raw axes; first authored use normalizes them. */
    axes: IAutoMovieJointAxes;

    /** Actual successfully normalized basis. */
    basis?: IAutoMovieJointAxes;

    /** Own-data optional affine frames; null coordinates bypass unused maps. */
    frame?: IAutoMovieRestFrame;

    /**
     * Fixed scalar/affine preparation; each produced composer has independent
     * dynamic factors.
     */
    queries?: ReturnType<typeof jointToQuaternionOnBasis.prepareScalarQueries>;

    /**
     * Original-order lazy prechecks, populated only for an actual used nonnull
     * map.
     */
    prechecks?: Partial<
      Record<
        "flexion" | "abduction" | "twist",
        ReturnType<typeof toRigAngle.prepare>
      >
    >;
  }

  /**
   * Ordered current admission, isolated from raw records and released with its
   * FK operation.
   */
  export interface IReader {
    /**
     * Start current membership without pretending any record already passed
     * admission.
     */
    begin(): void;

    /**
     * Admit one actual record and write its articulation into the operation's
     * selection; a record admitted before is the value it was admitted as.
     */
    admit(joint: IAutoMovieJointPose): void;

    /** The last admitted articulation, as a fresh quaternion. */
    rotation(): IAutoMovieQuaternion;

    /**
     * Admit actual staged scalar values in the same order, retaining no tuple
     * or joint record.
     */
    admitValues(
      bone: AutoMovieHumanoidBone,
      flexion: number | null,
      abduction: number | null,
      twist: number | null,
    ): void;

    /**
     * Preserve every actual check outside a genuine fixed ancestor demand,
     * selecting no articulation.
     */
    validateValues(
      bone: AutoMovieHumanoidBone,
      flexion: number | null,
      abduction: number | null,
      twist: number | null,
    ): void;

    /**
     * After the actual source scan, write the currently selected rooted
     * articulations into the rows, four numbers a bone; rows of bones the scan
     * did not write are left as they are.
     */
    snapshot(rows: Float64Array): void;
  }
}

/**
 * Preserve original F/A/T finite/frame admission order before reading the next
 * coordinate.
 */
function clinical(
  joint: IAutoMovieJointPose,
  axis: "flexion" | "abduction" | "twist",
  frame: IAutoMovieAxisFrame | undefined,
  previous: number | null | undefined,
  convention: preparePoseJointResolution.IConvention,
): number | null {
  const value: number | null = joint[axis];
  return clinicalValue(value, axis, frame, previous, convention);
}

/**
 * The same current finite/frame admission serves record and already-staged
 * scalar inputs.
 */
function clinicalValue(
  value: number | null,
  axis: "flexion" | "abduction" | "twist",
  frame: IAutoMovieAxisFrame | undefined,
  previous: number | null | undefined,
  convention: preparePoseJointResolution.IConvention,
): number | null {
  // A prior successful nonnull reading already admitted this immutable frame.
  if (
    (previous === undefined || previous === null) &&
    value !== null &&
    frame !== undefined
  ) {
    const readers: NonNullable<
      preparePoseJointResolution.IConvention["prechecks"]
    > = (convention.prechecks ??= {});
    const read: ReturnType<typeof toRigAngle.prepare> = (readers[axis] ??=
      toRigAngle.prepare());
    read(value, frame);
  }
  return value;
}

/** Preserve each actual record-name lookup at the original cache-miss sites. */
function boneOf(joint: IAutoMovieJointPose): AutoMovieHumanoidBone {
  return joint.bone;
}

/** A staged entry already owns its actual name; no new property read is needed. */
function stagedBone(bone: AutoMovieHumanoidBone): AutoMovieHumanoidBone {
  return bone;
}
