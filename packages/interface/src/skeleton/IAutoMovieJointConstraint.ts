import type { IAutoMovieAngleRange } from "./IAutoMovieAngleRange";
import type { IAutoMovieFlexedAbduction } from "./IAutoMovieFlexedAbduction";
import type { IAutoMovieSwingTwistLimit } from "./IAutoMovieSwingTwistLimit";

/**
 * The anatomical range of motion (ROM) of a single joint, decomposed into the
 * three clinical rotation axes.
 *
 * Per-axis intervals and an optional combined cap give the ROM validator
 * explicit numeric limits. These checks supply correction paths and degree
 * overshoots; they do not reconstruct an individual's anatomy, collisions or
 * dynamics.
 *
 * A joint constrains only the axes it actually has. A hinge joint (elbow, knee)
 * sets `flexion` and leaves `abduction` / `twist` `null` (immobile on those
 * axes; any non-zero value there is rejected). A ball joint (shoulder, hip)
 * sets all three. `null` means "this axis does not move", which is _stronger_
 * than an empty range and distinct from "unconstrained".
 *
 * **Axis & sign conventions** (right-handed, clinical neutral = 0°):
 *
 * - `flexion`: sagittal plane. Positive = flexion (curl forward / bend the
 *   joint), negative = extension. e.g. elbow `[0, 150]` (no hyper-extension),
 *   knee `[0, 135]`, hip `[-30, 120]`.
 * - `abduction`: frontal plane. Positive = abduction (limb away from midline),
 *   negative = adduction. e.g. shoulder `[-50, 180]`.
 * - `twist`: transverse plane, axial rotation about the limb's long axis.
 *   Positive = external / lateral rotation, negative = internal / medial. e.g.
 *   shoulder `[-90, 90]`.
 *
 * The numeric tables live in `@automovie/engine` (sourced from goniometry
 * norms), not here; this type only describes their _shape_. Per-character
 * overrides are possible (a contortionist, a stylized non-human rig) by
 * supplying a different constraint on the bone.
 *
 * Reference: clinical goniometry / joint ROM norms (AAOS, Norkin & White,
 * _Measurement of Joint Motion_).
 */
export interface IAutoMovieJointConstraint {
  /**
   * Sagittal-plane range: flexion (+) / extension (−). `null` if the joint does
   * not flex/extend.
   */
  flexion: IAutoMovieAngleRange | null;

  /**
   * Frontal-plane range: abduction (+) / adduction (−). `null` for a pure hinge
   * joint that does not abduct/adduct.
   */
  abduction: IAutoMovieAngleRange | null;

  /**
   * Optional rise of the abduction ceiling with flexion, for a joint that
   * abducts further flexed (a hip); the `abduction` interval holds as given
   * when absent or null. It applies to the three-angle gate only, not to a
   * `swingTwist` gate.
   */
  abductionFlexed?: IAutoMovieFlexedAbduction | null;

  /**
   * Transverse-plane range: external (+) / internal (−) axial rotation. `null`
   * if the joint does not twist.
   */
  twist: IAutoMovieAngleRange | null;

  /**
   * Optional finite combined flexion/abduction cap in degrees, strictly above
   * zero, in addition to the separate intervals. swingConeAngle evaluates
   * 2*acos(cos(flexion/2)*cos(abduction/2)) with degree inputs and output; null
   * angles contribute zero. Null or omission applies no combined cap. This is a
   * declared quaternion-derived metric rather than proof of a joint's true
   * reachable anatomy.
   *
   * For finite representable arithmetic, the formula returns between zero and
   * 360 degrees. When both axis magnitudes are at most 180 degrees it stays at
   * most 180, making a 180-degree cap inactive for that admitted domain.
   * Multi-turn angles are periodic and need not be monotonic from neutral;
   * extreme finite inputs can overflow the conversion arithmetic.
   */
  swingDeg?: number | null;

  /**
   * Present for a ball joint gated by swing and twist instead of by its three
   * clinical angles one by one: a shoulder, a hip. The limb's long axis must
   * point in a direction the `flexion` and `abduction` intervals (and
   * `swingDeg`) reach, whatever the twist, and the limb's turn about that axis
   * must lie in this `twist` interval, measured by the swing-twist
   * decomposition from the rig's rest pose: the turn left once the shortest
   * swing from the rest direction to the limb's direction is taken off. The
   * clinical `twist` interval is then a reading of the pose, not a limit.
   *
   * Three clinical angles name one rotation twice (two readings), and at the
   * swing where two of them turn about one axis (an arm pointing straight
   * ahead) a box of them is not a continuous set of rotations: two rotations a
   * fraction of a degree apart can lie one inside and one far outside it. The
   * swing-twist decomposition from the rest pose is singular only at the rest
   * direction's antipode, which the record's `reach` keeps outside the range,
   * so a limit on it holds continuously wherever the limb can be. Null or
   * omission keeps the three-angle gate.
   */
  swingTwist?: IAutoMovieSwingTwistLimit | null;
}
