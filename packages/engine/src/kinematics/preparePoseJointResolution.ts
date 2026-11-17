import type {
  AutoMovieHumanoidBone, IAutoMovieJointAxes, IAutoMovieJointPose,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import type { IAutoMovieAxisFrame } from "../rom/IAutoMovieAxisFrame";
import type { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { toRigAngle } from "../rom/toRigAngle";
import { jointToQuaternionOnBasis } from "./jointToQuaternionOnBasis";
import { normalizeJointAxes } from "./normalizeJointAxes";
import type { preparePoseResolutionChanges } from "./preparePoseResolutionChanges";

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

  /** Private successful quaternion and independent query-owned composer. */
  rotation: IAutoMovieQuaternion;
  compose: ReturnType<typeof jointToQuaternionOnBasis.prepare>;

  /** Latest scan that actually authored this name. */
  epoch: number;
}

/** Null clinical rest genuinely resolves to this exact positive-zero rig angle. */
const REST_ANGLE: readonly [number] = Object.freeze<readonly [number]>([0]);

/** Immutable rig declarations share only factors actually requested at exact rig rest. */
const REST_ANGLES: jointToQuaternionOnBasis.IFixedAngles = Object.freeze({
  flexion: REST_ANGLE,
  abduction: REST_ANGLE,
  twist: REST_ANGLE,
});

/**
 * Admit changing ordered joint records on one genuine immutable prepared rig.
 *
 * Static conventions own lazy successful basis, fixed-axis scalar and affine
 * preparations. Each operation/name owns its independent changing factors,
 * exact clinical tuple and last quaternion. begin starts current membership;
 * admit always validates the actual next record before sharing completed math;
 * its quaternion remains private and the outer producer copies public reads.
 * snapshot is used only after the producer's complete source scan and copies
 * the last current quaternion per rooted node for a genuine fixed baseline.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines record and staged-scalar degree/null admission, static/operation ownership, original name/coordinate lookup sites, first-use frame admission, membership and baseline snapshots.
 * @evidence contracts/development/implementation.md#principled-implementation Records retain original basis/name/coordinate reads; staged tuples supply their actual earlier-copied primitives. Both use one F/A/T finite/frame owner and one successful composition/commit path. Exact tuples share only completed quaternions. Immutable conventions share fixed basis/affine metadata and actual positive-zero rest factors without admitting unused frames. snapshot filters actual current membership.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Owns numerical checks and one composition/finish path for actual records or staged scalars. validateValues performs those same normalized-basis/clinicalValue checks without selecting an unnecessary articulation. Static name readers preserve original lookup timing; numerical rule owners and hierarchy/change owners remain separate.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts All duplicate, stray and undemanded records remain admitted in original order. No boolean, pose identity, tolerance, editable whitelist or target answer substitutes for validation. Null never admits an unused frame, failed conversion never replaces a successful row and raw APIs remain separate.
 * @evidence contracts/development/implementation.md#efficient-algorithms J records retain constant-size exact checks. Unchanged selected tuples reuse quaternions; fixed-demand exclusions validate without creating a joint row, factors or quaternion. Immutable basis/affine work remains lazy, and three actual positive-zero factors/one inner may share across composers. Fixed-source snapshot costs O(B); runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Static axes/frames are owned immutable snapshots. prepareQueries shares fixed scalar/affine prerequisites and lazy exact positive-zero rig-rest factors; negative zero and other values use ordinary factor paths. Every current finite check and first-use per-axis precheck retains original order, while dynamic factors/inner storage and fresh outputs remain operation-owned.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The operation owns O(U+B) last successful rows and rooted references until release, without raw joint/pose/result history. Each static convention owns one basis/factory, at most three precheck/axis/affine readers, three actual zero factors and one fixed inner until rig release. Snapshots own only B private quaternion references and retain no operation reader or source records.
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
  return {
    begin: (): void => {
      ++epoch;
      changes.begin();
    },
    admit: (joint: IAutoMovieJointPose): IAutoMovieQuaternion => {
      const known: IReading | undefined = joints.get(joint.bone);
      const convention: preparePoseJointResolution.IConvention =
        known?.convention ?? conventions.get(joint.bone) ?? fallback;
      const basis: IAutoMovieJointAxes = convention.basis ??=
        normalizeJointAxes(convention.axes, "jointToQuaternion axes");
      const flexion: number | null = clinical(joint, "flexion", convention.frame?.flexion, known?.flexion, convention);
      const abduction: number | null = clinical(joint, "abduction", convention.frame?.abduction, known?.abduction, convention);
      const twist: number | null = clinical(joint, "twist", convention.frame?.twist, known?.twist, convention);
      return finish(joint, boneOf, known, convention, basis, flexion, abduction, twist);
    },
    admitValues: (bone: AutoMovieHumanoidBone, f: number | null, a: number | null,
      t: number | null): void => {
      const known: IReading | undefined = joints.get(bone);
      const convention: preparePoseJointResolution.IConvention =
        known?.convention ?? conventions.get(bone) ?? fallback;
      const basis: IAutoMovieJointAxes = convention.basis ??=
        normalizeJointAxes(convention.axes, "jointToQuaternion axes");
      const flexion: number | null = clinicalValue(f, "flexion", convention.frame?.flexion, known?.flexion, convention);
      const abduction: number | null = clinicalValue(a, "abduction", convention.frame?.abduction, known?.abduction, convention);
      const twist: number | null = clinicalValue(t, "twist", convention.frame?.twist, known?.twist, convention);
      finish(bone, stagedBone, known, convention, basis, flexion, abduction, twist);
    },
    validateValues: (bone: AutoMovieHumanoidBone, f: number | null, a: number | null,
      t: number | null): void => {
      const known: IReading | undefined = joints.get(bone);
      const convention: preparePoseJointResolution.IConvention =
        known?.convention ?? conventions.get(bone) ?? fallback;
      convention.basis ??= normalizeJointAxes(convention.axes, "jointToQuaternion axes");
      clinicalValue(f, "flexion", convention.frame?.flexion, known?.flexion, convention);
      clinicalValue(a, "abduction", convention.frame?.abduction, known?.abduction, convention);
      clinicalValue(t, "twist", convention.frame?.twist, known?.twist, convention);
    },
    snapshot: (): (IAutoMovieQuaternion | undefined)[] => byNode.map(
      (joint: IReading | undefined): IAutoMovieQuaternion | undefined =>
        joint?.epoch === epoch ? joint.rotation : undefined,
    ),
  };

  /** Commit one actually admitted reading; name getters stay at their original miss-only sites. */
  function finish<T>(source: T, nameOf: (source: T) => AutoMovieHumanoidBone,
    known: IReading | undefined, convention: preparePoseJointResolution.IConvention,
    basis: IAutoMovieJointAxes, flexion: number | null, abduction: number | null,
    twist: number | null): IAutoMovieQuaternion {
    if (known !== undefined && Object.is(known.flexion, flexion) &&
      Object.is(known.abduction, abduction) && Object.is(known.twist, twist)) {
      known.epoch = epoch;
      changes.write(known.index, known.rotation);
      return known.rotation;
    }
    const compose: ReturnType<typeof jointToQuaternionOnBasis.prepare> = known?.compose ??
      (convention.queries ??= jointToQuaternionOnBasis.prepareQueries(
        basis, convention.frame, REST_ANGLES,
      ))();
    const rotation: IAutoMovieQuaternion = compose({ flexion, abduction, twist });
    if (known === undefined) {
      const reading: IReading = { convention, index: indices.get(nameOf(source)),
        flexion, abduction, twist, rotation, compose, epoch };
      joints.set(nameOf(source), reading);
      if (reading.index !== undefined) byNode[reading.index] = reading;
      changes.write(reading.index, rotation);
    } else {
      known.flexion = flexion;
      known.abduction = abduction;
      known.twist = twist;
      known.rotation = rotation;
      known.epoch = epoch;
      changes.write(known.index, rotation);
    }
    return rotation;
  }
}

/**
 * Internal immutable conventions and actual-admission operation reader.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes static unadmitted conventions/lazy successful preparation from current ordered operation reads and actual baseline snapshots.
 * @evidence contracts/development/design.md#principled-representation IConvention owns exact raw axes/optional affine degree frames and only successfully used fixed preparation; IReader represents current ordered clinical admission and a genuine completed source snapshot. Numerical types alone certify neither input validity nor a completed scan.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The rig constructs conventions; state uses begin/admit/snapshot. Genuine tuple scans use admitValues for actual ancestry and validateValues elsewhere, preserving all checks while omitting unnecessary math/rows. No private factor/frame, target or external admitted option escapes.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No body subset, editable whitelist, target answer, pose/time cache or externally set validity flag is represented. Fixed and dynamic preparation have separate actual owners; ordinary authored records keep complete admission.
 */
export namespace preparePoseJointResolution {
  /** Actual immutable clinical inputs and bounded lazy preparation from successful use. */
  export interface IConvention {
    /** Own-data raw axes; first authored use normalizes them. */
    axes: IAutoMovieJointAxes;

    /** Actual successfully normalized basis. */
    basis?: IAutoMovieJointAxes;

    /** Own-data optional affine frames; null coordinates bypass unused maps. */
    frame?: IAutoMovieRestFrame;

    /** Fixed scalar/affine preparation; each produced composer has independent dynamic factors. */
    queries?: ReturnType<typeof jointToQuaternionOnBasis.prepareQueries>;

    /** Original-order lazy prechecks, populated only for an actual used nonnull map. */
    prechecks?: Partial<Record<"flexion" | "abduction" | "twist", ReturnType<typeof toRigAngle.prepare>>>;
  }

  /** Ordered current admission, isolated from raw records and released with its FK operation. */
  export interface IReader {
    /** Start current membership without pretending any record already passed admission. */
    begin(): void;

    /** Admit one actual record and lend its private successful quaternion to the owning FK producer only. */
    admit(joint: IAutoMovieJointPose): IAutoMovieQuaternion;

    /** Admit actual staged scalar values in the same order, retaining no tuple or joint record. */
    admitValues(bone: AutoMovieHumanoidBone, flexion: number | null,
      abduction: number | null, twist: number | null): void;

    /** Preserve every actual check outside a genuine fixed ancestor demand, selecting no articulation. */
    validateValues(bone: AutoMovieHumanoidBone, flexion: number | null,
      abduction: number | null, twist: number | null): void;

    /** After the actual source scan, copy only its currently selected rooted quaternion references. */
    snapshot(): (IAutoMovieQuaternion | undefined)[];
  }
}

/** Preserve original F/A/T finite/frame admission order before reading the next coordinate. */
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

/** The same current finite/frame admission serves record and already-staged scalar inputs. */
function clinicalValue(
  value: number | null, axis: "flexion" | "abduction" | "twist",
  frame: IAutoMovieAxisFrame | undefined, previous: number | null | undefined,
  convention: preparePoseJointResolution.IConvention,
): number | null {
  if (value !== null && !Number.isFinite(value))
    throw new Error(`jointToQuaternion ${axis} must be finite or null, but was ${value}`);

  // A prior successful nonnull reading already admitted this immutable frame.
  if ((previous === undefined || previous === null) && value !== null && frame !== undefined) {
    const readers: NonNullable<preparePoseJointResolution.IConvention["prechecks"]> = convention.prechecks ??= {};
    const read: ReturnType<typeof toRigAngle.prepare> = readers[axis] ??= toRigAngle.prepare();
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
