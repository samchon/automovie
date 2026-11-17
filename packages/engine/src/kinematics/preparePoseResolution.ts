import type {
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import type { IAutoMovieResolvedBone } from "./IAutoMovieResolvedBone";
import { DEFAULT_JOINT_AXES } from "./constants/DEFAULT_JOINT_AXES";
import { jointToQuaternionOnBasis } from "./jointToQuaternionOnBasis";
import { normalizeJointAxes } from "./normalizeJointAxes";
import { resolvePoseBone } from "./resolvePoseBone";

/** Raw ordered FK operations and the identity lent to immutable prepared rigs. */
interface IReader {
  /** Read each actual clinical/frame value in its original order, sharing pure basis/factor work. */
  joint(
    joint: IAutoMovieJointPose,
    axes: IAutoMovieJointAxes | undefined,
    frame: IAutoMovieRestFrame | undefined,
  ): IAutoMovieQuaternion;

  /** Preserve all raw rest/parent/articulation reads and return the original fresh FK output. */
  bone(
    bone: IAutoMovieBone,
    parentRotation: IAutoMovieQuaternion,
    parentPosition: IAutoMovieVector3,
    articulation: IAutoMovieQuaternion,
  ): IAutoMovieResolvedBone;
}

/** Callable-only snapshots are weakly owned by their actual plain factory reader. */
const NATIVE_READERS: WeakMap<IReader, IReader> = new WeakMap();

/**
 * Own pure joint-composition work within one synchronous motion evaluation.
 * Raw records retain their complete original getter, validation and arithmetic
 * order. Immutable prepared rigs additionally use this reader's identity to
 * scope their genuine static-input dependency rows; this raw adapter itself
 * never certifies a mutable transform from an identity or resampled tuple.
 * Release the reader when the synchronous evaluation ends.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines raw ordered admission/fresh outputs, pure basis work and immutable-rig operation identity. isNative below states actual factory provenance, unchanged own-data callable checks, no foreign metadata observation and its limited non-admission meaning.
 * @evidence contracts/development/implementation.md#principled-implementation Normalize the current actual axes with undefined-only defaults, then always perform original current clinical/frame admission before sharing exact-angle factors on that admitted basis. Raw bone calls delegate directly to resolvePoseBone, preserving rest rotation, Hamilton products, rest translation, vector arithmetic and final bone-name read order.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure resolvePose owns traversal, mutable OnBasis owns current clinical/frame reads and resolvePoseBone owns raw composition. Immutable rigs own sparse rows under this key. A private weak callable snapshot alone lets isNative recognize original factory readers without invoking or trusting their methods.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No raw joint name, clinical/frame tuple or transform is sampled to create a cache key. Null coordinates keep unused sign/neutral bypass; used coordinates retain finite/frame failure order. Every overwritten authored record remains visited, raw bones retain original reads and no caller flag, target or time certifies equivalence.
 * @evidence contracts/development/implementation.md#efficient-algorithms Raw joints keep original admission and share pure factors; raw bones retain their full composition. Immutable-rig clients independently retain sparse dependency reuse. isNative costs one weak lookup and, only for a registered reader, two own-descriptor reads/temporary descriptors; no rig/input scan or numerical callback runs. Speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Basis identity selects pure arithmetic, never mutable frame validity. All current reads remain live. isNative proves only actual factory identity and unchanged own-data joint/bone callables; proxy/wrapped/foreign keys miss before metadata access. It certifies no source admission, pose or solve, and consumers still own their separate source proof.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Weak basis keys own bounded factor workspaces until operation release. The private weak native-reader registry retains only two original callable references without a strong reader key. No raw input, result history or handle is stored; immutable rigs separately own weak-keyed dynamic rows.
 */
export function preparePoseResolution(): IReader {
  const joints: WeakMap<IAutoMovieJointAxes, ReturnType<typeof jointToQuaternionOnBasis.prepareMutable>> =
    new WeakMap();
  const reader: IReader = {
    joint: (
      joint: IAutoMovieJointPose,
      axes: IAutoMovieJointAxes | undefined,
      frame: IAutoMovieRestFrame | undefined,
    ): IAutoMovieQuaternion => {
      const basis: IAutoMovieJointAxes = normalizeJointAxes(
        axes === undefined ? DEFAULT_JOINT_AXES : axes,
        "jointToQuaternion axes",
      );
      const known: ReturnType<typeof jointToQuaternionOnBasis.prepareMutable> | undefined = joints.get(basis);
      const read: ReturnType<typeof jointToQuaternionOnBasis.prepareMutable> =
        known ?? jointToQuaternionOnBasis.prepareMutable(basis);
      const rotation: IAutoMovieQuaternion = read(joint, frame);
      if (known === undefined) joints.set(basis, read);
      return rotation;
    },
    bone: resolvePoseBone,
  };
  NATIVE_READERS.set(reader, { joint: reader.joint, bone: reader.bone });
  return reader;
}

/**
 * Actual factory-reader provenance without claiming any numerical admission.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines unchanged own-data callable checks, unknown/proxy/wrapped refusal without metadata access and no source/pose validity claim.
 * @evidence contracts/development/design.md#principled-representation The private weak registry associates an actual plain reader with its original two callables; descriptors expose current data-method identity without executing accessor getters.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Canonical source preparation uses isNative before issuing reusable source metadata; no caller registration, brand setter or numerical readiness flag is public.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Unregistered objects return false before descriptor reads. Registered objects must still own the exact original data methods; wrappers/accessors/bound replacements never inherit provenance, while freezing unchanged methods remains valid.
 */
export namespace preparePoseResolution {
  /**
   * Whether this exact factory reader still has its original data methods.
   * A weak-map miss observes no metadata, so foreign and proxy wrappers are
   * refused without traps. Only registered plain objects receive descriptor
   * reads; accessor getters never execute. Descriptor flags may differ when
   * the original callable values remain unchanged, including Object.freeze.
   * This constant-time check neither calls a reader nor certifies any source,
   * pose, mapping or solved result. Recheck at consumption after possible
   * method changes; no state, handle or new strong reference is retained.
   */
  export function isNative(reader: ReturnType<typeof preparePoseResolution>): boolean {
    const known: IReader | undefined = NATIVE_READERS.get(reader);
    if (known === undefined) return false;
    const joint: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(reader, "joint");
    const bone: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(reader, "bone");
    return joint !== undefined && Object.hasOwn(joint, "value") && joint.value === known.joint &&
      bone !== undefined && Object.hasOwn(bone, "value") && bone.value === known.bone;
  }
}
