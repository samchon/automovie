/**
 * A fighter's body measured on his actual figure in the neutral pose, in his
 * own frame (+X forward, +Y up, +Z own left) with the origin on the floor
 * between his feet. Every stance, guard and technique shape scales from
 * these lengths, so a different body moves the shapes with it.
 *
 * @evidence docs/research/kickboxing/techniques.md#reach Reach and range are measured on the two bodies, never fixed.
 * @evidence docs/research/kickboxing/ring-generalship.md#step The step and the rope margin scale from the stance and the shoulder half-width.
 * @evidence contracts/development/common.md#meaningful-documentation States the frame, origin and units of every member.
 * @evidence contracts/development/design.md#principled-representation Lengths in metres and points in the body frame; all positive by construction from the figure.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The members the shape, range and footwork laws read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No member names a fighter.
 */
export interface IFighterMeasure {
  /** Hip joint height above the floor, metres. */
  hip: number;

  /** Half the distance between the hip joints, metres. */
  hipHalfWidth: number;

  /** Shoulder joint height, metres. */
  shoulder: number;

  /** Half the distance between the shoulder joints, metres. */
  shoulderHalfWidth: number;

  /** Head centre height, metres. */
  head: number;

  /** Head collider radius, metres. */
  headRadius: number;

  /** Glove radius, metres; zero without gloves. */
  gloveRadius: number;

  /** Shoulder to glove centre at full extension, metres. */
  armReach: number;

  /** Thigh length, hip to knee, metres. */
  thigh: number;

  /** Shank length, knee to ankle, metres. */
  shank: number;

  /** Ankle joint height above the sole, metres. */
  ankle: number;

  /** Ankle to toe tip, metres. */
  foot: number;

  /**
   * How far the guard carries each struck level ahead of the stance origin,
   * metres: the face, the stomach and the lead thigh's front surfaces on the
   * guard placed by limb fitting, so ranges keep the displayed bodies apart.
   */
  front: { head: number; body: number; leg: number };
}
