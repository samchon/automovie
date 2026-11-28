import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePhysicalJoint } from "./IAutoMoviePhysicalJoint";
import type { IAutoMoviePhysicalMaterial } from "./IAutoMoviePhysicalMaterial";
import type { IAutoMoviePhysicalSegment } from "./IAutoMoviePhysicalSegment";

/**
 * An articulated body's neutral geometry and mass in a body frame with +Y up.
 * Segment placements use metres in that frame. Each segment gives its mass
 * in kilograms and its colliders and inertia in its own bone frame. Include
 * any attached equipment in the owning segment before computing the totals.
 *
 * Supply finite quantities and unit rotations. The joints form one rooted
 * tree, and shape material IDs refer to records in this profile. Call
 * AutoMovieEnginePhysics.validatePhysicalProfile to read diagnostic paths
 * for field and cross-reference errors. It leaves the supplied data intact.
 */
export interface IAutoMoviePhysicalProfile {
  /** Nonblank provider identifier for the profile or its source model. */
  id: string;

  /**
   * Positive total mass in kilograms, including equipment. Use the sum of
   * the declared segment masses.
   */
  mass: number;

  /**
   * Centre of mass in the neutral body frame, metres. Transform each
   * segment's local centre into that frame before taking the mass-weighted
   * mean of those centres.
   */
  centerOfMass: IAutoMovieVector3;

  /**
   * One or more segments with unique nonblank bone names and at least one
   * collision shape each, in any order.
   */
  segments: IAutoMoviePhysicalSegment[];

  /**
   * Links between known segments. Give every segment except the root one
   * parent. Both anchors of each link meet in the neutral pose.
   */
  joints: IAutoMoviePhysicalJoint[];

  /**
   * Optional unordered pairs of distinct bone names whose colliders may
   * overlap. Give each pair once with a nonblank reason. The simulator
   * skips both contact and sensor overlap for those pairs. Omission keeps
   * the built-in exclusions for a segment and its direct joint neighbours.
   */
  collisionExclusions?: {
    /** First segment. */ a: string;

    /** Second segment. */ b: string;

    /** Geometric reason for this exclusion. */ reason: string;
  }[];

  /**
   * Physical contact responses keyed by unique nonblank material IDs.
   * Every collision shape names one of these responses.
   */
  materials: IAutoMoviePhysicalMaterial[];

  /**
   * Optional neutral station for the mirrored humanoid ear rays. The point
   * is in the head bone's local frame, in metres. Humanoid surface readers
   * project its lateral rays onto the actual head collider. With the station
   * absent, each ray starts at the head collider bounds centre.
   */
  earRayOrigin?: IAutoMovieVector3;

  /**
   * Nonblank provider note naming the source of the physical parameters
   * and describing their population limits and approximations.
   */
  provenance: string;
}
