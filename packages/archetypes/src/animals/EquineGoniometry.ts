import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { EquineJointLimits } from "./EquineJointLimits";
import type { QuadrupedBody } from "./QuadrupedBody";

/**
 * Measure explicitly acquired equine landmark rays in an oriented clinical plane.
 *
 * This operation measures the caller's actual markers; it cannot establish that
 * they are anatomically correct. The selected study's published landmarks and
 * included-angle side must be reproduced during acquisition. In particular,
 * coarse skeleton bar endpoints are not an automatic substitute for skin
 * markers or the 2016 goniometer rays. The measurement plane passes through the
 * middle marker, and its normal chooses the included-angle orientation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States acquisition ownership, shared coordinate/length units, plane orientation, degree output and the distinction between landmark measurement and anatomical admission.
 * @evidence contracts/development/design.md#principled-representation Three ordered points and an explicit oriented plane define two projected rays; source DOI and actual bone select the matching clinical convention. Unknown runtime limits remain outer-null.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Archetypes owns measurement of its equine references; the engine's existing Vector3 owns vector arithmetic and EquineJointLimits owns the primary statistics and comparison.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No inferred camera plane, mirrored anatomy, coarse-bar landmark mapping or clinical mean-to-admission conversion enters the interface.
 */
export namespace EquineGoniometry {
  /**
   * Caller-acquired points and plane, all in one right-handed Cartesian frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines marker order, the vertex, arbitrary consistent length units, explicit plane orientation and the source convention the caller must reproduce.
   * @evidence contracts/development/design.md#principled-representation A fixed three-point tuple rules out a missing vertex at the type boundary; the normal and coordinates require finite/nondegenerate runtime validation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The input contains only actual measurement data and the existing source/bone identities needed for clinical comparison.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No optional plane, neutral-pose offset, assumed anatomical axis or invented measurement landmark is accepted.
   */
  export interface IInput {
    /** Actual distal bone identifying its proximal joint. */
    readonly bone: QuadrupedBody.Bone;

    /** Source whose landmark rays and included-angle side were acquired. */
    readonly studyDoi: EquineJointLimits.IStudy["doi"];

    /** First ray endpoint, joint vertex, second ray endpoint, in one length unit. */
    readonly markers: readonly [
      Readonly<IAutoMovieVector3>,
      Readonly<IAutoMovieVector3>,
      Readonly<IAutoMovieVector3>,
    ];

    /** Nonzero oriented plane normal; magnitude is irrelevant and is normalized. */
    readonly planeNormal: Readonly<IAutoMovieVector3>;
  }

  /**
   * Measured oriented angle and its source-specific observational diagnostic.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines canonical [0,360) degrees, right-handed first-to-second orientation, unit projected rays, nullable comparison and unknown runtime limits.
   * @evidence contracts/development/design.md#principled-representation The normalized plane and ordered projected rays make the measured orientation inspectable; the diagnostic retains the selected primary row instead of an inferred anatomical verdict.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Measurement consumers receive the angle, its geometric interpretation and the same clinical comparison used by the reference API.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A missing reference remains null, and no mean-relative position becomes an accepted pose or an immobile axis.
   */
  export interface IResult {
    /** Right-handed angle from first to second projected ray around normal. */
    readonly includedAngle: number;

    /** Independent unit normal used for measurement. */
    readonly normal: Readonly<IAutoMovieVector3>;

    /** Independent unit first and second rays after projection into the plane. */
    readonly projectedRays: readonly [
      Readonly<IAutoMovieVector3>,
      Readonly<IAutoMovieVector3>,
    ];

    /** Selected study diagnostic, or null when this joint has no retained data. */
    readonly comparison: EquineJointLimits.IComparison | null;

    /** Anatomical local rotation limits remain unknown on all axes. */
    readonly limits: null;
  }

  /**
   * Project actual marker rays and compare their oriented included angle.
   *
   * Translation, positive uniform scaling and normal magnitude do not change
   * the angle. Reversing the normal reverses its orientation. Projection removes
   * out-of-plane displacement; it does not correct perspective or certify that
   * the caller acquired the study's sagittal view. Exact computed zero rays or
   * projections, and nonrepresentable intermediate differences, refuse.
   *
   * @param input Actual acquired landmarks, chosen plane, source and joint.
   * @returns Independent geometric measurement and source-specific comparison.
   * @throws {RangeError} For nonfinite data, a zero normal/ray/projection, nonfinite intermediate differences or a source not measuring the selected known joint.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents coordinate/scale invariants, angle orientation, acquisition/perspective limitations, finite/nondegenerate refusal and independent output ownership.
   * @evidence contracts/development/implementation.md#principled-implementation Shared Vector3 normalizes the supplied normal and marker displacements. The double cross n cross (d cross n) orthogonally projects each direction; atan2(n dot (a cross b), a dot b) gives the oriented planar angle, canonicalized to [0,360) degrees before the source-specific comparison.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Validate acquired components, normalize the explicit plane, project its two vertex-relative rays, compute the angle and call EquineJointLimits.compare with the selected DOI.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No anatomical landmarks or plane are guessed; no copied IK solver, absolute-value folding, tolerance-based valid pose or mean-to-limit box substitutes for the actual measurement.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant vector work and O(S) source selection for at most two reference cohorts, with constant geometric storage and O(S) independently copied clinical rows.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Normalization of the plane is shared by both projections and angle orientation; primary statistics and source selection have one owner in EquineJointLimits.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Inputs are read only; new normalized/projected vectors and comparison records retain no caller marker objects, handles, history or global cache.
   */
  export function measure(input: IInput): IResult {
    for (const point of [...input.markers, input.planeNormal])
      if (!finite(point))
        throw new RangeError("Equine marker coordinates and plane normal must be finite");
    if (
      input.planeNormal.x === 0 &&
      input.planeNormal.y === 0 &&
      input.planeNormal.z === 0
    )
      throw new RangeError("The equine measurement plane needs a nonzero normal");

    const normal: IAutoMovieVector3 = Vector3.normalize(input.planeNormal);
    const first: IAutoMovieVector3 = project(input.markers[0]);
    const second: IAutoMovieVector3 = project(input.markers[2]);
    const signedDegrees: number =
      Math.atan2(
        Vector3.dot(normal, Vector3.cross(first, second)),
        Vector3.dot(first, second),
      ) * (180 / Math.PI);
    const oriented: number = signedDegrees < 0 ? 360 + signedDegrees : signedDegrees;

    // Rounding a negative infinitesimal turn to 360 represents the same zero ray.
    const includedAngle: number = oriented === 360 || oriented === 0 ? 0 : oriented;
    return {
      includedAngle,
      normal,
      projectedRays: [first, second],
      comparison: EquineJointLimits.compare(
        input.bone,
        input.studyDoi,
        includedAngle,
      ),
      limits: null,
    };

    /** A unit double-cross projection retains orientation without subtractive axial cancellation. */
    function project(marker: Readonly<IAutoMovieVector3>): IAutoMovieVector3 {
      const displacement: IAutoMovieVector3 = Vector3.subtract(marker, input.markers[1]);
      if (!finite(displacement))
        throw new RangeError("Equine marker differences must be finite");
      const direction: IAutoMovieVector3 = Vector3.normalize(displacement);
      const projected: IAutoMovieVector3 = Vector3.cross(
        normal,
        Vector3.cross(direction, normal),
      );
      if (!finite(projected) || Vector3.length(projected) === 0)
        throw new RangeError("An equine marker ray has no nonzero planar projection");
      return Vector3.normalize(projected);
    }
  }
}

/** Component checks preserve the shared Vector3 owner's normalization behavior. */
function finite(point: Readonly<IAutoMovieVector3>): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z);
}
