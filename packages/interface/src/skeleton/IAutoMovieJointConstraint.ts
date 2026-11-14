import { IAutoMovieAngleRange } from "./IAutoMovieAngleRange";

/**
 * The anatomical range of motion (ROM) of a single joint, decomposed into the three clinical rotation axes.
 *
 * Per-axis intervals and an optional combined cap give the ROM validator explicit numeric limits. These checks supply correction paths and degree overshoots; they do not reconstruct an individual's anatomy, collisions or dynamics.
 *
 * A joint constrains only the axes it actually has. A hinge joint (elbow, knee) sets `flexion` and leaves `abduction` / `twist` `null` (immobile on those axes; any non-zero value there is rejected). A ball joint (shoulder, hip) sets all three. `null` means "this axis does not move", which is _stronger_ than an empty range and distinct from "unconstrained".
 *
 * **Axis & sign conventions** (right-handed, clinical neutral = 0°):
 *
 * - `flexion`: sagittal plane. Positive = flexion (curl forward / bend the joint), negative = extension. e.g. elbow `[0, 150]` (no hyper-extension), knee `[0, 135]`, hip `[-30, 120]`.
 * - `abduction`: frontal plane. Positive = abduction (limb away from midline), negative = adduction. e.g. shoulder `[-50, 180]`.
 * - `twist`: transverse plane, axial rotation about the limb's long axis. Positive = external / lateral rotation, negative = internal / medial. e.g. shoulder `[-90, 90]`.
 *
 * The numeric tables live in `@automovie/engine` (sourced from goniometry norms), not here; this type only describes their _shape_. Per-character overrides are possible (a contortionist, a stylized non-human rig) by supplying a different constraint on the bone.
 *
 * Reference: clinical goniometry / joint ROM norms (AAOS, Norkin & White, _Measurement of Joint Motion_).
 *
 * @evidence contracts/development/design.md#principled-representation Per-axis finite degree intervals admit clinical flexion, abduction and twist, while optional swing bounds their combined quaternion-derived sweep on top of the axis boxes.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three nullable ranges and one optional combined cap describe rig-specific motion limits independently from engine default tables and FK axis definitions.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Null axis admits neutral null/zero and rejects nonzero motion. Under the usual per-axis absolute bounds of 180 degrees, the swing metric stays at most 180, so a 180-degree cap adds no restriction; broader or multi-turn angles need that premise stated and are not a complete anatomy or dynamics proof.
 * @evidence contracts/development/common.md#meaningful-documentation Defines clinical signs and degrees, null-axis meaning, rig overrides, the combined-swing formula and headroom limit, and the optional swing-twist gate of a ball joint.
 */
export interface IAutoMovieJointConstraint {
  /**
   * Sagittal-plane range: flexion (+) / extension (−). `null` if the joint does not flex/extend.
   */
  flexion: IAutoMovieAngleRange | null;

  /**
   * Frontal-plane range: abduction (+) / adduction (−). `null` for a pure hinge joint that does not abduct/adduct.
   */
  abduction: IAutoMovieAngleRange | null;

  /**
   * Transverse-plane range: external (+) / internal (−) axial rotation. `null` if the joint does not twist.
   */
  twist: IAutoMovieAngleRange | null;

  /**
   * Optional finite combined flexion/abduction cap in degrees, strictly above zero, in addition to the separate intervals. swingConeAngle evaluates 2*acos(cos(flexion/2)*cos(abduction/2)) with degree inputs and output; null angles contribute zero. Null or omission applies no combined cap. This is a declared quaternion-derived metric rather than proof of a joint's true reachable anatomy.
   *
   * For finite representable arithmetic, the formula returns between zero and 360 degrees. When both axis magnitudes are at most 180 degrees it stays at most 180, making a 180-degree cap inactive for that admitted domain. Multi-turn angles are periodic and need not be monotonic from neutral; extreme finite inputs can overflow the conversion arithmetic.
   */
  swingDeg?: number | null;

  /**
   * Present for a ball joint gated by swing and twist instead of by its three clinical angles one by one: a shoulder, a hip. The limb's long axis must point in a direction the `flexion` and `abduction` intervals (and `swingDeg`) reach, whatever the twist, and the limb's turn about that axis must lie in this `twist` interval, measured by the swing-twist decomposition from the rig's rest pose: the turn left once the shortest swing from the rest direction to the limb's direction is taken off. The clinical `twist` interval is then a reading of the pose, not a limit.
   *
   * Three clinical angles name one rotation twice (two readings), and at the swing where two of them turn about one axis (an arm pointing straight ahead) a box of them is not a continuous set of rotations: two rotations a fraction of a degree apart can lie one inside and one far outside it. The swing-twist decomposition from the rest pose is singular only at the rest direction's antipode, which the record's `reach` keeps outside the range, so a limit on it holds continuously wherever the limb can be. Null or omission keeps the three-angle gate.
   */
  swingTwist?: IAutoMovieJointConstraint.ISwingTwist | null;
}

/** Companion types of {@link IAutoMovieJointConstraint}. */
export namespace IAutoMovieJointConstraint {
  /**
   * The swing-and-twist limit of a ball joint.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the measure, its origin, its unit and its sign.
   * @evidence contracts/development/design.md#principled-representation An interval of the twist about the limb's own axis left after the shortest swing from rest, by the swing-twist decomposition whose only singularity lies at the rest direction's antipode, which the farthest reach keeps outside.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members: the twist interval and the farthest reach; the swing's region is read from the constraint's own flexion and abduction intervals, not restated, and the record is additive and optional on the constraint.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a constraint without it keeps the three-angle gate unchanged.
   */
  export interface ISwingTwist {
    /** The limb's turn about its own long axis measured from the rig's rest pose by the swing-twist decomposition, degrees; positive external, negative internal. */
    twist: IAutoMovieAngleRange;

    /** The farthest the limb's long axis may point from its rest direction, degrees, below 180, so the rest direction's antipode, where the twist has no value, lies outside the range; the reach the flexion and abduction intervals give when absent. */
    reach?: number;
  }
}
