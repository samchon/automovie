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
 * @evidence contracts/development/common.md#meaningful-documentation Defines ordered clinical-degree/null admission, static versus operation ownership, first-use frame admission, current membership and baseline snapshot semantics, with each companion's lifetime below.
 * @evidence contracts/development/implementation.md#principled-implementation Every record selects the original basis then reads finite F/A/T coordinates and admits each used frame before the next coordinate. Exact repeated tuples share only a completed quaternion. Independent composers preserve OnBasis Hamilton grouping while a genuine immutable convention shares only axis scalars and successful affine metadata. snapshot filters actual current scan membership before copying private rotations.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Owns prepared joint admission/conversion only. normalizeJointAxes, toRigAngle and OnBasis retain their numerical rules; preparePoseResolutionChanges receives actual successful rotations, while prepared FK retains hierarchy, root and frame composition.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts All duplicate, stray and undemanded records remain admitted in original order. No boolean, pose identity, tolerance, editable whitelist or target answer substitutes for validation. Null never admits an unused frame, failed conversion never replaces a successful row and raw APIs remain separate.
 * @evidence contracts/development/implementation.md#efficient-algorithms J current records take constant-size exact admission each; unchanged tuples avoid quaternion composition. Immutable conventions normalize a basis and prepare axis/affine arithmetic only on actual first use, shared across independent operation composers. Fixed-source snapshot costs O(B); runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Static axes/frames are actual owned immutable snapshots. prepareQueries shares only fixed scalar/affine prerequisites without fixedAngles, leaving every dynamic factor/inner product query-local. Current finite checks and first-use per-axis prechecks retain original error order; only successful exact tuples or the real fixed-source producer share numerical work.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The operation owns O(U+B) last successful rows and rooted references until release, without raw joint/pose/result history. Each static convention owns at most one basis/factory, three precheck converters and the factory's three axis/affine readers until rig release. Snapshots own only B private quaternion references and retain no operation reader or source records.
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
      if (known !== undefined && Object.is(known.flexion, flexion) &&
        Object.is(known.abduction, abduction) && Object.is(known.twist, twist)) {
        known.epoch = epoch;
        changes.write(known.index, known.rotation);
        return known.rotation;
      }
      const compose: ReturnType<typeof jointToQuaternionOnBasis.prepare> = known?.compose ??
        (convention.queries ??= jointToQuaternionOnBasis.prepareQueries(basis, convention.frame))();
      const rotation: IAutoMovieQuaternion = compose({ flexion, abduction, twist });
      if (known === undefined) {
        const reading: IReading =
          { convention, index: indices.get(joint.bone), flexion, abduction, twist, rotation, compose, epoch };
        joints.set(joint.bone, reading);
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
    },
    snapshot: (): (IAutoMovieQuaternion | undefined)[] => byNode.map(
      (joint: IReading | undefined): IAutoMovieQuaternion | undefined =>
        joint?.epoch === epoch ? joint.rotation : undefined,
    ),
  };
}

/**
 * Internal immutable conventions and actual-admission operation reader.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes static unadmitted conventions/lazy successful preparation from current ordered operation reads and actual baseline snapshots.
 * @evidence contracts/development/design.md#principled-representation IConvention owns exact raw axes/optional affine degree frames and only successfully used fixed preparation; IReader represents current ordered clinical admission and a genuine completed source snapshot. Numerical types alone certify neither input validity nor a completed scan.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The static rig constructs conventions; one prepared FK state uses begin/admit/snapshot. Existing ROM, quaternion and basis owners provide numeric types, and no target, factor metadata, mutable frame row or raw external admission option escapes.
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
