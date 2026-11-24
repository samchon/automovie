import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieArchetypeEquineJointLimits } from "./AutoMovieArchetypeEquineJointLimits";
import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";

/**
 * Measure explicitly acquired equine landmark rays in an oriented clinical
 * plane.
 *
 * This operation measures the caller's markers; it cannot establish that they
 * are anatomically correct. The selected study's published landmarks and
 * included-angle side must be reproduced during acquisition. In particular,
 * coarse skeleton bar endpoints are not an automatic substitute for skin
 * markers or the 2016 goniometer rays. The measurement plane passes through the
 * middle marker, and its normal chooses the included-angle orientation.
 */
export namespace AutoMovieArchetypeEquineGoniometry {
  /** Caller-acquired points and plane, all in one right-handed Cartesian frame. */
  export interface IInput {
    /** Distal bone identifying its proximal joint. */
    readonly bone: AutoMovieArchetypeQuadrupedBody.Bone;

    /** Source whose landmark rays and included-angle side were acquired. */
    readonly studyDoi: AutoMovieArchetypeEquineJointLimits.IStudy["doi"];

    /**
     * First ray endpoint, joint vertex, second ray endpoint, in one length
     * unit.
     */
    readonly markers: readonly [
      Readonly<IAutoMovieVector3>,
      Readonly<IAutoMovieVector3>,
      Readonly<IAutoMovieVector3>,
    ];

    /** Nonzero oriented plane normal; magnitude is irrelevant and is normalized. */
    readonly planeNormal: Readonly<IAutoMovieVector3>;
  }

  /** Measured oriented angle and its source-specific observational diagnostic. */
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
    readonly comparison: AutoMovieArchetypeEquineJointLimits.IComparison | null;

    /** Anatomical local rotation limits remain unknown on all axes. */
    readonly limits: null;
  }

  /**
   * Project marker rays and compare their oriented included angle.
   *
   * Translation, positive uniform scaling and normal magnitude do not change
   * the angle. Reversing the normal reverses its orientation. Projection
   * removes out-of-plane displacement; it does not correct perspective or
   * certify that the caller acquired the study's sagittal view. Exact computed
   * zero rays or projections, and nonrepresentable intermediate differences,
   * refuse.
   *
   * @param input Acquired landmarks, chosen plane, source and joint.
   * @returns Independent geometric measurement and source-specific comparison.
   * @throws {RangeError} For a zero normal/ray/projection or a source not
   *   measuring the selected known joint.
   */
  export function measure(input: IInput): IResult {
    if (
      input.planeNormal.x === 0 &&
      input.planeNormal.y === 0 &&
      input.planeNormal.z === 0
    )
      throw new RangeError(
        "The equine measurement plane needs a nonzero normal",
      );

    const normal: IAutoMovieVector3 = Vector3.normalize(input.planeNormal);
    const first: IAutoMovieVector3 = project(input.markers[0]);
    const second: IAutoMovieVector3 = project(input.markers[2]);
    const signedDegrees: number =
      Math.atan2(
        Vector3.dot(normal, Vector3.cross(first, second)),
        Vector3.dot(first, second),
      ) *
      (180 / Math.PI);
    const oriented: number =
      signedDegrees < 0 ? 360 + signedDegrees : signedDegrees;

    // Rounding a negative infinitesimal turn to 360 represents the same zero ray.
    const includedAngle: number =
      oriented === 360 || oriented === 0 ? 0 : oriented;
    return {
      includedAngle,
      normal,
      projectedRays: [first, second],
      comparison: AutoMovieArchetypeEquineJointLimits.compare(
        input.bone,
        input.studyDoi,
        includedAngle,
      ),
      limits: null,
    };

    /**
     * A unit double-cross projection retains orientation without subtractive
     * axial cancellation.
     */
    function project(marker: Readonly<IAutoMovieVector3>): IAutoMovieVector3 {
      const displacement: IAutoMovieVector3 = Vector3.subtract(
        marker,
        input.markers[1],
      );
      const direction: IAutoMovieVector3 = Vector3.normalize(displacement);
      const projected: IAutoMovieVector3 = Vector3.cross(
        normal,
        Vector3.cross(direction, normal),
      );
      if (Vector3.length(projected) === 0)
        throw new RangeError(
          "An equine marker ray has no nonzero planar projection",
        );
      return Vector3.normalize(projected);
    }
  }
}
