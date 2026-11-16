import type {
  IAutoMovieJointAxes,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMovieAxisFrame } from "../rom/IAutoMovieAxisFrame";
import type { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";

/**
 * Own-data copies of the static numerical inputs used by prepared FK.
 * Non-record malformed values remain unchanged for their original lazy
 * admission owner; these copies do not certify valid axes or clinical maps.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines immutable own-data copying and the separation from numerical admission.
 * @evidence contracts/development/design.md#principled-representation Copies the exact vector/quaternion scalars, axis placement and optional clinical affine maps that determine prepared FK, preserving absence and malformed non-record values for lazy admission.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only prepareSkeletonPoseResolution uses these four forms for static rig inputs and private root snapshots; existing interface/ROM types own their represented quantities.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No input is normalized, repaired, branded admitted or specialized to a body. Own-data reads preserve inherited numerical properties instead of assuming enumerable record layout.
 */
export namespace PoseResolutionSnapshot {
  /**
   * Copy an unadmitted clinical basis and its exact optional twist placement.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States exact raw-axis copying and deferred admission.
   * @evidence contracts/development/implementation.md#principled-implementation The three direction vectors and declared placement determine clinical composition; exact frozen scalar copies isolate source edits without changing normalization or error policy.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Reuses this owner's vector copier; normalizeJointAxes remains the separate admission owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Undefined placement stays absent, malformed non-record values remain for lazy refusal, and no default or normalized substitute is inserted.
   * @evidence contracts/development/implementation.md#efficient-algorithms Copies nine components and one optional placement in constant time/storage.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The prepared rig retains the frozen result while its explicit snapshot is in use; subsequent source edits require another preparation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one frozen axes record with three frozen direction records and retains no source object, history or handle.
   */
  export function axes(input: IAutoMovieJointAxes): IAutoMovieJointAxes {
    if (typeof input !== "object" || input === null) return input;
    return Object.freeze({
      flexion: vector(input.flexion),
      abduction: vector(input.abduction),
      twist: vector(input.twist),
      ...(input.twistPlacement === undefined ? {} : { twistPlacement: input.twistPlacement }),
    });
  }

  /**
   * Freeze three actual numerical properties in their existing frame and units.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States exact component copying and inherited frame/unit semantics.
   * @evidence contracts/development/implementation.md#principled-implementation A vector is determined by x/y/z, so copying those actual property values isolates source mutation without enumeration assumptions or arithmetic.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One constant-size copier serves rest offsets, clinical directions and private root translations.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not normalize, clamp or replace malformed non-record values; existing consuming owners keep validation.
   * @evidence contracts/development/implementation.md#efficient-algorithms Three property reads and one frozen record take constant work/storage.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The owner compares dynamic root scalars before copying and retains static copies for its explicit prepared-rig lifetime.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Owns only three copied scalars, without retaining a source record or external handle.
   */
  export function vector(input: IAutoMovieVector3): IAutoMovieVector3 {
    return typeof input !== "object" || input === null ? input
      : Object.freeze({ x: input.x, y: input.y, z: input.z });
  }

  /**
   * Freeze exact quaternion components without normalization or enumeration.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States exact glTF-ordered component ownership and absence of normalization.
   * @evidence contracts/development/implementation.md#principled-implementation Four scalar components determine the Hamilton operands; copying x/y/z/w preserves their original values and multiplication grouping.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Serves static rest rotations and dynamically changed private root rotations with the same copying rule.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No unit-length repair, sign canonicalization or malformed-value substitute is introduced.
   * @evidence contracts/development/implementation.md#efficient-algorithms Four component reads and one frozen record take constant work/storage.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The prepared owner copies static rest once and dynamic roots only after actual scalar changes, preserving immutable private operand identity between changes.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns four owned scalars and retains no input, history or handle.
   */
  export function quaternion(input: IAutoMovieQuaternion): IAutoMovieQuaternion {
    return typeof input !== "object" || input === null ? input
      : Object.freeze({ x: input.x, y: input.y, z: input.z, w: input.w });
  }

  /**
   * Copy optional affine clinical maps while preserving lazy null-angle admission.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States optional-axis preservation and the unchanged lazy frame-admission boundary.
   * @evidence contracts/development/implementation.md#principled-implementation Clinical maps depend on each optional sign and neutral degree value; frozen copies isolate source edits while toRigAngle still admits only axes a nonnull clinical coordinate uses.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Uses one private scalar-map copier and leaves frame validation/conversion with the existing ROM owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Absent maps stay absent and malformed non-record entries are preserved instead of defaulted or eagerly refused.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most three optional maps and six scalars are copied in constant time/storage.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The explicit rig preparation owns the immutable map; source edits require a new rig snapshot rather than mutating this mapping.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns at most four frozen records, retaining no source object, pose or handle.
   */
  export function frame(input: IAutoMovieRestFrame): IAutoMovieRestFrame {
    if (typeof input !== "object" || input === null) return input;
    const snapshot: IAutoMovieRestFrame = {};
    if (input.flexion !== undefined) snapshot.flexion = axisFrame(input.flexion);
    if (input.abduction !== undefined) snapshot.abduction = axisFrame(input.abduction);
    if (input.twist !== undefined) snapshot.twist = axisFrame(input.twist);
    return Object.freeze(snapshot);
  }
}

/** Preserve malformed scalar/non-record entries for their ordinary toRigAngle refusal. */
function axisFrame(input: IAutoMovieAxisFrame): IAutoMovieAxisFrame {
  return typeof input !== "object" || input === null ? input
    : Object.freeze({ sign: input.sign, neutral: input.neutral });
}
