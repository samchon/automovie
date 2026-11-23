import type {
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMoviePoseResolution,
  IAutoMovieQuaternion,
  IAutoMovieRestFrame,
} from "@automovie/interface";

import { DEFAULT_JOINT_AXES } from "./constants/DEFAULT_JOINT_AXES";
import { jointToQuaternionOnBasis } from "./jointToQuaternionOnBasis";
import { normalizeJointAxes } from "./normalizeJointAxes";
import { resolvePoseBone } from "./resolvePoseBone";

/** Raw ordered FK operations and the identity lent to immutable prepared rigs: the interface contract. */
type IReader = IAutoMoviePoseResolution;

/**
 * The factory's reader: its two methods as own data properties, as before,
 * and the originals in private fields, which are its provenance. A brand
 * check (`#joint in reader`) refuses every other object, a proxy among
 * them, without a trap or a property read, and costs the reader two slots
 * instead of an entry in a weak registry a reader.
 */
class NativeReader implements IReader {
  /** The original joint reader, the provenance `native` compares the own property with. */
  readonly #joint: IReader["joint"];

  /** The original bone reader, likewise. */
  readonly #bone: IReader["bone"];

  /** The joint reader, an own data property as the plain reader had it. */
  joint: IReader["joint"];

  /** The bone reader, an own data property. */
  bone: IReader["bone"];

  /** This reader's composers by admitted basis, made at its first joint read. */
  #composers: WeakMap<IAutoMovieJointAxes, ReturnType<typeof jointToQuaternionOnBasis.prepareMutable>> | undefined;

  /**
   * Every reader's joint method, one function reading its own reader's
   * composers: a reader made per call (a limb fit's operation) then costs
   * its object and no closure. Called on anything but a reader of this
   * class (a structural copy, or detached), it composes the same rotation
   * without keeping a composer.
   */
  static readonly #read: IReader["joint"] = function (
    this: unknown,
    joint: IAutoMovieJointPose,
    axes: IAutoMovieJointAxes | undefined,
    frame: IAutoMovieRestFrame | undefined,
  ): IAutoMovieQuaternion {
    const basis: IAutoMovieJointAxes = normalizeJointAxes(
      axes === undefined ? DEFAULT_JOINT_AXES : axes,
      "jointToQuaternion axes",
    );
    const self: unknown = this;
    if (typeof self !== "object" || self === null || !(#composers in self))
      return jointToQuaternionOnBasis.prepareMutable(basis)(joint, frame);
    const composers: WeakMap<IAutoMovieJointAxes, ReturnType<typeof jointToQuaternionOnBasis.prepareMutable>> =
      (self.#composers ??= new WeakMap());
    const known: ReturnType<typeof jointToQuaternionOnBasis.prepareMutable> | undefined = composers.get(basis);
    const read: ReturnType<typeof jointToQuaternionOnBasis.prepareMutable> =
      known ?? jointToQuaternionOnBasis.prepareMutable(basis);
    const rotation: IAutoMovieQuaternion = read(joint, frame);
    if (known === undefined) composers.set(basis, read);
    return rotation;
  };

  /** Make a reader with its composers made at its first joint read. */
  public constructor() {
    this.joint = NativeReader.#read;
    this.bone = resolvePoseBone;
    this.#joint = this.joint;
    this.#bone = this.bone;
  }

  /** Whether a reader is this factory's with its original methods still its own data properties. */
  public static native(reader: IReader): boolean {
    if (!(#joint in reader)) return false;
    const joint: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(reader, "joint");
    const bone: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(reader, "bone");
    return joint !== undefined && Object.hasOwn(joint, "value") && joint.value === reader.#joint &&
      bone !== undefined && Object.hasOwn(bone, "value") && bone.value === reader.#bone;
  }
}

/**
 * Own pure joint-composition work within one synchronous motion evaluation.
 * Raw records retain their complete original getter, validation and arithmetic
 * order. Immutable prepared rigs additionally use this reader's identity to
 * scope their genuine static-input dependency rows; this raw adapter itself
 * never certifies a mutable transform from an identity or resampled tuple.
 * Release the reader when the synchronous evaluation ends.
 */
export function preparePoseResolution(): IReader {
  return new NativeReader();
}

/**
 * Actual factory-reader provenance without claiming any numerical admission.
 */
export namespace preparePoseResolution {
  /**
   * Whether this exact factory reader still has its original data methods.
   * A failed brand check observes no metadata, so foreign and proxy wrappers are
   * refused without traps. Only the factory's own readers receive descriptor
   * reads; accessor getters never execute. Descriptor flags may differ when
   * the original callable values remain unchanged, including Object.freeze.
   * This constant-time check neither calls a reader nor certifies any source,
   * pose, mapping or solved result. Recheck at consumption after possible
   * method changes; no state, handle or new strong reference is retained.
   */
  export function isNative(reader: ReturnType<typeof preparePoseResolution>): boolean {
    return NativeReader.native(reader);
  }
}
