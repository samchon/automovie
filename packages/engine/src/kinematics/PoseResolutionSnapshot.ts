import type {
  IAutoMovieJointAxes,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMovieAxisFrame } from "../rom/IAutoMovieAxisFrame";
import type { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";

/**
 * Own-data copies and exact numerical comparisons used by prepared FK.
 * Non-record malformed values remain unchanged for their original lazy
 * admission owner; these copies do not certify valid axes or clinical maps.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines immutable own-data copying, exact component comparison and their separation from numerical admission.
 * @evidence contracts/development/design.md#principled-representation Copies the exact vector/quaternion scalars, axis placement and optional clinical affine maps that determine prepared FK, preserving absence and malformed non-record values for lazy admission. Exact vector/quaternion comparisons preserve signed-zero distinctions for actual dependency invalidation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Prepared rig/state/change owners use four copy forms and two exact comparisons for static inputs, private root snapshots and actual articulation changes; existing interface/ROM types own their represented quantities.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No input is normalized, repaired, branded admitted or specialized to a body. Own-data reads preserve inherited numerical properties instead of assuming enumerable record layout.
 */
export namespace PoseResolutionSnapshot {
  /**
   * Compare actual quaternion components, including signed zero, without arithmetic.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States exact x/y/z/w comparison and signed-zero semantics, without an admission claim.
   * @evidence contracts/development/implementation.md#principled-implementation Identical actual private immutable operands are equal directly; otherwise Object.is on all four components proves exact operand equality under prepared FK's ownership, including NaN equivalence and distinct signed zeros.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One component comparison serves root snapshots, local articulation and final-query descendant invalidation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Identity reuse requires actual private immutable operands, never a caller's raw mutable-input certificate. No tolerance, normalization, pose/time key or caller admission flag replaces component equality.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most eight component reads and four constant-time comparisons allocate no records.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only actual current and previous numerical values are compared; owners retain their own unchanged-source and admission contracts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a boolean and retains no operands or resource.
   */
  export function sameQuaternion(left: IAutoMovieQuaternion, right: IAutoMovieQuaternion): boolean {
    if (left === right) return true;
    return Object.is(left.x, right.x) && Object.is(left.y, right.y) &&
      Object.is(left.z, right.z) && Object.is(left.w, right.w);
  }

  /**
   * Compare actual vector components, retaining signed-zero distinctions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States exact component comparison, including signed zero, without changing the vector's frame or units.
   * @evidence contracts/development/implementation.md#principled-implementation Identical actual private immutable operands are equal directly; otherwise Object.is on x/y/z identifies exactly equal translation operands without normalization or numerical reassociation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The prepared root owner compares translations here and delegates changed-value copying to vector.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Identity reuse requires actual private immutable operands instead of raw mutable-input trust. No tolerance, coordinate omission or input repair substitutes for the actual three values.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most six component reads and three constant-time comparisons allocate no records.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Equality is recomputed from actual operands on every call; only the owning producer may reuse its private unchanged value afterward.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a boolean without retaining either operand or any resource.
   */
  export function sameVector(left: IAutoMovieVector3, right: IAutoMovieVector3): boolean {
    if (left === right) return true;
    return Object.is(left.x, right.x) && Object.is(left.y, right.y) &&
      Object.is(left.z, right.z);
  }

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
