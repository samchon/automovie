/**
 * Lengths of one person's body that the motion laws scale from, measured on
 * the person's neutral standing skeleton, in metres above the floor or
 * between joints.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Every member names what is measured and its unit.
 * @evidence contracts/development/design.md#principled-representation Lengths in metres measured from the built body, so a law scales a step, a reach or a seat drop from the person who performs it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The lengths the gait, sitting, handover, duel and riding laws read; the student body owns their measurement.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No person is named.
 */
export interface IBodyMeasure {
  /** Stature, metres. */
  stature: number;

  /** Hip joint centre above the floor standing, metres. */
  hip: number;

  /** Half the distance between the hip joint centres, metres. */
  hipHalfWidth: number;

  /** Shoulder joint centre above the floor standing, metres. */
  shoulder: number;

  /** Half the distance between the shoulder joint centres, metres. */
  shoulderHalfWidth: number;

  /** Head centre above the floor standing, metres. */
  head: number;

  /** Shoulder to the centre of the closed hand, metres. */
  armReach: number;

  /** Hip to ankle along the straight leg, metres. */
  legLength: number;

  /** Ankle joint centre above the floor standing, metres. */
  ankle: number;

  /** Ankle forward to the toe tip, metres. */
  foot: number;
}
