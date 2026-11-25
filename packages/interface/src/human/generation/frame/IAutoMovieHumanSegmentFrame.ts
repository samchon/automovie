import type { AutoMovieMatrix3Tuple } from "../../../geometry/AutoMovieMatrix3Tuple";
import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";

/**
 * A Human frame with millimetre origin and unit axes X, Y, Z in the reference
 * coordinates selected by its operation. Calibration and chain inputs use the
 * registered figure frame; compose receives its child in the parent's frame,
 * and inverse reverses the source and reference frames.
 *
 * Axes are ordered basis vectors (matrix columns), not row-major matrix rows.
 * Producers establish orthonormality and right-handedness; this mutable record
 * performs no validation or copying.
 */
export interface IAutoMovieHumanSegmentFrame {
  /** Origin in the operation's reference frame, millimetres. */
  origin: AutoMovieVector3Tuple;

  /** Unit axes X, Y, Z, right-handed. */
  axes: [AutoMovieVector3Tuple, AutoMovieVector3Tuple, AutoMovieVector3Tuple];
}

/**
 * Operation-specific chain, relative-transform and angle-decomposition
 * contracts. Human owns their evaluation; each member states its frame and
 * units.
 */
export namespace IAutoMovieHumanSegmentFrame {
  /**
   * Result of AutoMovieHumanSegmentFrame.relative. `child` written in
   * `parent`'s frame: its origin `A_p^T (o_c - o_p)` and its rotation `A_p^T
   * A_c`.
   */
  export type IRelativeResult = {
    /** Child origin expressed in the parent frame, millimetres. */
    offset: AutoMovieVector3Tuple;
    /** Child basis expressed in the parent basis as a 3 by 3 rotation matrix. */
    rotation: AutoMovieMatrix3Tuple;
  };

  /**
   * Parent-first named segment frames, all expressed in the same registered
   * figure coordinates. chain converts these inputs into parent-local offsets
   * and rotations; roots keep the figure frame. The caller supplies a valid
   * named tree. The outer array is borrowed readonly; frame objects remain
   * mutable.
   */
  export type ChainSegments = readonly {
    /** Segment identity used to resolve its parent and pose. */
    name: string;
    /** Parent segment identity; null marks the root. */
    parent: string | null;
    /** Segment frame in the common reference coordinates, millimetres. */
    frame: IAutoMovieHumanSegmentFrame;
  }[];

  /**
   * The rotation lookup supplied to AutoMovieHumanSegmentFrame.world. A
   * returned matrix replaces the joint's reference rotation; it is not
   * multiplied onto that reference as a delta. Child rotations are
   * parent-local, and root rotations use the figure frame. Undefined retains
   * the reference rotation, so an all-undefined lookup reconstructs the
   * reference frames. World placement uses `A_child = A_parent R` and `o_child
   * = o_parent + A_parent offset`, parent first.
   */
  export type WorldPose = (name: string) => AutoMovieMatrix3Tuple | undefined;

  /**
   * Result of AutoMovieHumanSegmentFrame.cardanZXY. The ISB joint-coordinate
   * angles of a Z-X-Y Cardan sequence (Grood and Suntay 1983, as ISB writes the
   * hip, knee and ankle in Wu et al. 2002 and the elbow and wrist in Wu et al.
   * 2005): `R = Rz(a) Rx(b) Ry(c)` with a about the parent's Z (flexion), b
   * about the floating axis (adduction or deviation) and c about the child's Y
   * (axial rotation), radians. From the product, `R[2][1] = sin b`, `R[0][1] =
   * -sin a cos b`, `R[1][1] = cos a cos b`, `R[2][0] = -cos b sin c`, `R[2][2]
   * = cos b cos c`.
   */
  export type CardanZXYResult = [number, number, number];

  /**
   * Result of AutoMovieHumanSegmentFrame.eulerYXY. The ISB shoulder angles, a
   * Y-X-Y Euler sequence (Wu et al. 2005 2.4.7, the humerus relative to the
   * thorax): `R = Ry(a) Rx(b) Ry(c)` with a the plane of elevation (0
   * abduction, 90 degrees forward flexion), b the elevation and c the axial
   * rotation (internal positive), radians. The text writes "elevation
   * (negative)", and its footnote 5 that the second rotation is by definition
   * in the negative direction as a consequence of the chosen axes, so the
   * branch with b in [-pi, 0] is returned: an arm raised sideways reads a plane
   * of elevation near 0 and a negative elevation. From the product, `R[1][1] =
   * cos b`, `R[0][1] = sin a sin b`, `R[2][1] = cos a sin b`, `R[1][0] = sin b
   * sin c`, `R[1][2] = -sin b cos c`, so with `sin b <= 0`: `a =
   * atan2(-R[0][1], -R[2][1])`, `c = atan2(-R[1][0], R[1][2])`.
   */
  export type EulerYXYResult = [number, number, number];
}
