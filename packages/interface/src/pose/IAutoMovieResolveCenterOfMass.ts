import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * A body's mass model. One segment's mass point.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the total kilogram mass and segment population used for posed COM and momentum calculations. Documents the bone-rest-frame COM and principal inertia orientation needed after posing.
 * @evidence contracts/development/design.md#principled-representation Segment masses and local centres describe a rigid mass model; the total must agree with the intended physical profile. Kilogram mass, metre local point, kg m² principal moments and principal-to-rest quaternion retain one segment's physical properties.
 * @evidence contracts/development/design.md#minimal-and-owned-surface resolveAutoMovieCenterOfMass constructs this model from a canonical physical profile, and resolveAutoMovieMomentum reuses its inertia information. COM and momentum readers share these profile-derived segment values rather than maintaining separate inertia catalogues.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Humanoid bone identities match the pose vocabulary; the record does not estimate anatomy or validate arbitrary mass data on assignment. The caller must keep bone identity and rest frames coherent with the pose; no density or inertia is guessed from the bone name.
 */
export namespace IAutoMovieResolveCenterOfMass {
  /**
   * A body's mass model.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the total kilogram mass and segment population used for posed COM and momentum calculations.
   * @evidence contracts/development/design.md#principled-representation Segment masses and local centres describe a rigid mass model; the total must agree with the intended physical profile.
   * @evidence contracts/development/design.md#minimal-and-owned-surface resolveAutoMovieCenterOfMass constructs this model from a canonical physical profile, and resolveAutoMovieMomentum reuses its inertia information.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Humanoid bone identities match the pose vocabulary; the record does not estimate anatomy or validate arbitrary mass data on assignment.
   */
  export interface IModel {
    /** Total mass, kilograms. */
    mass: number;

    /** Every segment's mass point. */
    segments: IAutoMovieResolveCenterOfMass.ISegment[];
  }

  /**
   * One segment's mass point.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the bone-rest-frame COM and principal inertia orientation needed after posing.
   * @evidence contracts/development/design.md#principled-representation Kilogram mass, metre local point, kg m² principal moments and principal-to-rest quaternion retain one segment's physical properties.
   * @evidence contracts/development/design.md#minimal-and-owned-surface COM and momentum readers share these profile-derived segment values rather than maintaining separate inertia catalogues.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The caller must keep bone identity and rest frames coherent with the pose; no density or inertia is guessed from the bone name.
   */
  export interface ISegment {
    /** The bone it rides. */
    bone: AutoMovieHumanoidBone;

    /** Kilograms. */
    mass: number;

    /** Centre of mass relative to the bone's joint, in its rest frame, metres. */
    point: IAutoMovieVector3;

    /** Principal moments about the segment's centre, kg m², the profile's own. */
    inertia: IAutoMovieVector3;

    /** The rotation from the principal axes to the bone's rest frame, so a posed segment's axes are its bone's world rotation times this (`resolveAutoMovieMomentum.inertia`). */
    axes: IAutoMovieQuaternion;
  }
}
