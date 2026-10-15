/**
 * One superficial form of the arm: a muscle belly, a furrow between bellies, or a bony prominence, raising or lowering the skin along a course down the limb.
 *
 * A form is placed in the arm's own coordinates, so one table serves both sides and every identity: its levels are arm levels, minus the fraction of the cut-to-elbow length above the elbow joint centre and plus the fraction of the elbow-to-wrist length below it, and its angle runs around the limb from the anterior surface toward the medial one in the forearm's frame in supination, which the arm's stations twist into the rest pose.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanArmRelief {
  /** Anatomical name, for reading the table. */
  name: string;

  /**
   * What lifts the skin, which decides what scales the form.
   *
   * - `muscle`: a muscle belly or the furrow between bellies, scaled by the arm's muscularity.
   * - `bone`: a subcutaneous bony landmark, at its own height.
   */
  kind: "muscle" | "bone";

  /** Angle of its crest from the anterior surface toward the medial one, degrees; negative angles turn toward the lateral side. */
  angle: number;

  /** Angular half width, degrees: the standard deviation of its Gaussian profile around the limb. */
  width: number;

  /** Height at the fullest point as a fraction of the section's mean deep radius, before the tissue scaling; negative for a furrow or hollow. */
  amplitude: number;

  /** Arm level where the form starts, fading to nothing. */
  from: number;

  /** Arm level of its fullest point. */
  peak: number;

  /** Arm level where it ends, fading to nothing. */
  to: number;
}
