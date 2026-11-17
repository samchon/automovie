import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";

/** Type contracts exchanged by AutoMovieHumanSegmentFrame; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanSegmentFrame {
  /** A segment frame: its origin and unit axes X, Y, Z in the figure's frame.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A segment frame: its origin and unit axes X, Y, Z in the figure's frame.
   * @evidence contracts/development/design.md#principled-representation `origin`: Origin, mm. `axes`: Unit axes X, Y, Z, right-handed.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanF1Frames.world, AutoMovieHumanF1Placement.frame, AutoMovieHumanSegmentFrame.fromYZ. Read by AutoMovieHumanSegmentFrame.parallel, AutoMovieHumanSegmentFrame.matrix, AutoMovieHumanSegmentFrame.toLocal. Also types AutoMovieHumanF1.pelvis, AutoMovieHumanF1Frames.pelvis.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `origin`, `axes`; callers supply the complete record.
   */
  export interface IFrame {
    /** Origin, mm. */
    origin: AutoMovieVector3Tuple;

    /** Unit axes X, Y, Z, right-handed. */
    axes: [AutoMovieVector3Tuple, AutoMovieVector3Tuple, AutoMovieVector3Tuple];
  }

  /** A 3 x 3 matrix by rows.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A 3 x 3 matrix by rows.
   * @evidence contracts/development/design.md#principled-representation A 3 x 3 matrix by rows. Ordered tuple slots are 0, 1, 2; fixed arity preserves their correspondence.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanSegmentFrame.matrix, AutoMovieHumanSegmentFrame.relative, AutoMovieHumanSegmentFrame.about. Read by AutoMovieHumanF1Frames.world, AutoMovieHumanSegmentFrame.columns, AutoMovieHumanSegmentFrame.world. Also types AutoMovieHumanSegmentFrame.m, AutoMovieHumanSegmentFrame.rotation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanF1Placement.NEUTRAL, AutoMovieHumanSegmentFrame.matrix, AutoMovieHumanSegmentFrame.columns, AutoMovieHumanSegmentFrame.m for a 3 x 3 matrix by rows.
   */
  export type M3 = [
    AutoMovieVector3Tuple,
    AutoMovieVector3Tuple,
    AutoMovieVector3Tuple,
  ];

  /** One segment of a chain: its parent, its origin in the parent's frame and its reference rotation.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One segment of a chain: its parent, its origin in the parent's frame and its reference rotation.
   * @evidence contracts/development/design.md#principled-representation `name`: The segment's name. `parent`: The parent segment's name; null for the root. `offset`: The origin in the parent's frame, mm (the root: in the figure's frame).
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanF1Frames.joints, AutoMovieHumanSegmentFrame.chain. Read by AutoMovieHumanSegmentFrame.world. Also types AutoMovieHumanF1Placing.CHAIN.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `name`, `parent`, `offset`, `rotation`; callers supply the complete record.
   */
  export interface IJoint {
    /** The segment's name. */
    name: string;

    /** The parent segment's name; null for the root. */
    parent: string | null;

    /** The origin in the parent's frame, mm (the root: in the figure's frame). */
    offset: AutoMovieVector3Tuple;

    /** The reference rotation `A_parent^T A_child` (the root: its axes as columns). */
    rotation: M3;
  }

  /** Result of AutoMovieHumanSegmentFrame.relative. `child` written in `parent`'s frame: its origin `A_p^T (o_c - o_p)` and its rotation `A_p^T A_c`.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation `child` written in `parent`'s frame: its origin `A_p^T (o_c - o_p)` and its rotation `A_p^T A_c`.
   * @evidence contracts/development/design.md#principled-representation `offset`: Child origin expressed in the parent frame, millimetres. `rotation`: Child basis expressed in the parent basis as a 3 by 3 rotation matrix.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanSegmentFrame.IRelativeResult is the canonical exchange used by AutoMovieHumanSegmentFrame.relative.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `offset`, `rotation`; callers supply the complete record.
   */
  export type IRelativeResult = {
    /** Child origin expressed in the parent frame, millimetres. */
    offset: AutoMovieVector3Tuple;
    /** Child basis expressed in the parent basis as a 3 by 3 rotation matrix. */
    rotation: M3;
  };

  /** The segments argument of AutoMovieHumanSegmentFrame.chain. The chain of a tree of segments given parent-first: each segment's origin in its parent's frame and its reference rotation. The
  root's offset is its origin and its rotation its axes, both in the figure's frame.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The chain of a tree of segments given parent-first: each segment's origin in its parent's frame and its reference rotation.
 * @evidence contracts/development/design.md#principled-representation The chain of a tree of segments given parent-first: each segment's origin in its parent's frame and its reference rotation. The outer tuple/array is readonly; nested element types determine whether their contents can change.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanSegmentFrame.ChainSegments is the canonical exchange used by AutoMovieHumanSegmentFrame.chain.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanSegmentFrame.chain for the chain of a tree of segments given parent-first: each segment's origin in its parent's frame and its reference rotation.
 */
  export type ChainSegments = readonly {
    /** Segment identity used to resolve its parent and pose. */
    name: string;
    /** Parent segment identity; null marks the root. */
    parent: string | null;
    /** Segment frame in the common reference coordinates, millimetres. */
    frame: IFrame;
  }[];

  /** The pose argument of AutoMovieHumanSegmentFrame.world. The frames of a posed chain: `A_child = A_parent R` and `o_child = o_parent + A_parent offset`, parent first. `pose` gives a joint's
  rotation by name; a joint it leaves undefined keeps its reference rotation, so `world(joints, () => undefined)` returns the reference
  frames and identity rotations the neutral body.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The frames of a posed chain: `A_child = A_parent R` and `o_child = o_parent + A_parent offset`, parent first.
 * @evidence contracts/development/design.md#principled-representation The frames of a posed chain: `A_child = A_parent R` and `o_child = o_parent + A_parent offset`, parent first. The callable takes name and returns M3 | undefined.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanSegmentFrame.WorldPose is the canonical exchange used by AutoMovieHumanSegmentFrame.world.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanSegmentFrame.world for the frames of a posed chain: `A_child = A_parent R` and `o_child = o_parent + A_parent offset`, parent first.
 */
  export type WorldPose = (name: string) => M3 | undefined;

  /** Result of AutoMovieHumanSegmentFrame.cardanZXY. The ISB joint-coordinate angles of a Z-X-Y Cardan sequence (Grood and Suntay 1983, as ISB writes the hip, knee and ankle in Wu et al.
  2002 and the elbow and wrist in Wu et al. 2005): `R = Rz(a) Rx(b) Ry(c)` with a about the parent's Z (flexion), b about the floating
  axis (adduction or deviation) and c about the child's Y (axial rotation), radians. From the product,
  `R[2][1] = sin b`, `R[0][1] = -sin a cos b`, `R[1][1] = cos a cos b`, `R[2][0] = -cos b sin c`, `R[2][2] = cos b cos c`.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The ISB joint-coordinate angles of a Z-X-Y Cardan sequence (Grood and Suntay 1983, as ISB writes the hip, knee and ankle in Wu et al.
 * @evidence contracts/development/design.md#principled-representation The ISB joint-coordinate angles of a Z-X-Y Cardan sequence (Grood and Suntay 1983, as ISB writes the hip, knee and ankle in Wu et al. Ordered tuple slots are 0, 1, 2; fixed arity preserves their correspondence.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanSegmentFrame.CardanZXYResult is the canonical exchange used by AutoMovieHumanSegmentFrame.cardanZXY.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanSegmentFrame.cardanZXY for the ISB joint-coordinate angles of a Z-X-Y Cardan sequence (Grood and Suntay 1983, as ISB writes the hip, knee and ankle in Wu et al.
 */
  export type CardanZXYResult = [number, number, number];

  /** Result of AutoMovieHumanSegmentFrame.eulerYXY. The ISB shoulder angles, a Y-X-Y Euler sequence (Wu et al. 2005 2.4.7, the humerus relative to the thorax): `R = Ry(a) Rx(b) Ry(c)`
  with a the plane of elevation (0 abduction, 90 degrees forward flexion), b the elevation and c the axial rotation (internal
  positive), radians. The text writes "elevation (negative)", and its footnote 5 that the second rotation is by definition in the
  negative direction as a consequence of the chosen axes, so the branch with b in [-pi, 0] is returned: an arm raised sideways reads
  a plane of elevation near 0 and a negative elevation. From the product, `R[1][1] = cos b`, `R[0][1] = sin a sin b`, `R[2][1] = cos a sin b`,
  `R[1][0] = sin b sin c`, `R[1][2] = -sin b cos c`, so with `sin b <= 0`: `a = atan2(-R[0][1], -R[2][1])`, `c = atan2(-R[1][0], R[1][2])`.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The ISB shoulder angles, a Y-X-Y Euler sequence (Wu et al.
 * @evidence contracts/development/design.md#principled-representation The ISB shoulder angles, a Y-X-Y Euler sequence (Wu et al. Ordered tuple slots are 0, 1, 2; fixed arity preserves their correspondence.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanSegmentFrame.EulerYXYResult is the canonical exchange used by AutoMovieHumanSegmentFrame.eulerYXY.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanSegmentFrame.eulerYXY for the ISB shoulder angles, a Y-X-Y Euler sequence (Wu et al.
 */
  export type EulerYXYResult = [number, number, number];
}
